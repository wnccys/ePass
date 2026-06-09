# Smart Contract Architecture & On-Chain Lifecycle

This document explains the Solidity smart contracts under `/smart-contracts` and how they manage the lifecycle of football player image rights tokenization.

---

## 1. Smart Contract Architecture

The core contracts interact in a modular pipeline to ensure safe minting and gas-efficient vault clones:

```
[RightsMinter.sol]
       │ (EIP-712 signature verification)
       ▼
[PlayerRightsMaster.sol] (ERC-721 NFT minting)
       │
       ▼ (NFT locked in vault)
[RightsVaultFactory.sol] (EIP-1167 Minimal Proxy Factory)
       │
       ▼ (Clones implementation logic)
[RightsVaultImpl.sol] (ERC-20 fractional shares & caution escrow)
```

### Core Contracts:
1. **`PlayerRightsMaster.sol`**: An ERC-721 contract representing the legal agreement (Master NFT). Includes custom `_update` logic to prevent open secondary transfers unless executed by `authorizedOperators`.
2. **`RightsMinter.sol`**: Manages EIP-712 cryptographically structured signature checks (`playerSig`, `clubSig`, `attorneySig`). Recovers signer addresses via `ECDSA` to prevent fraud before triggering minting.
3. **`RightsVaultFactory.sol`**: Deploys lightweight clones of `RightsVaultImpl` using the **EIP-1167 Minimal Proxy Pattern** to decrease contract deployment gas fees by 90%.
4. **`RightsVaultImpl.sol`**: Governs fractional ERC-20 shares, caution deposits (50% caution escrow / 50% redeemable reserve splits), and automatic penalty calculations for early rescission (65% penalty before 182.5 days).

---

## 2. On-Chain Lifecycle Flow

An agreement is processed through 5 core steps:

```
[NFT Minted to Club]
       │
       ▼ (Step 1: Deploy Vault Proxy)
RightsVaultFactory.createVault(...)
       │
       ▼ (Step 2: Approve NFT Transfer)
PlayerRightsMaster.approve(vaultAddress, tokenId)
       │
       ▼ (Step 3: Fractionalize Shares)
RightsVault.fractionalize(tokenId, supply)  <--- Locks NFT, mints $P_IMAGE shares
       │
       ▼ (Step 4: Approve USDC Caution)
MockUSDC.approve(vaultAddress, cautionAmount)
       │
       ▼ (Step 5: Activate Contract)
RightsVault.depositCaution(cautionAmount)   <--- Status becomes ACTIVE
  - OR -
RightsVault.depositAndMint(totalAmount)     <--- Alternative: splits caution/reserve
```

### The 5-Step Process:
1. **Deploy Vault Proxy**: Call `createVault(...)` on the factory. Deploys a clone vault with status `PENDING`.
2. **Approve NFT**: The club calls `approve(vaultAddress, tokenId)` on `PlayerRightsMaster` to authorize the vault clone to pull the NFT.
3. **Fractionalize**: The club calls `fractionalize(tokenId, supply)` on the vault clone. The vault pulls and locks the NFT in storage, then mints the total supply of ERC-20 tokens, distributing them proportionally to the Player, Club, and Attorney based on configured basis points (BPS).
4. **Approve Caution**: Approve the vault to pull USDC stablecoins.
5. **Activate**: Call `depositCaution` (deposits caution amount) or `depositAndMint` (deposits USDC, allocating 50% to caution and 50% to reserve, minting new shares to the club). Status becomes `ACTIVE`.

---

## 3. Post-Activation Actions

* **`redeem(shares)`**: Token holders burn `$P_IMAGE` shares to withdraw stablecoins proportionally from the vault's `redeemableReserve`:
  $$\text{stablecoinAmount} = \frac{\text{shares} \times \text{redeemableReserve}}{\text{totalSupply}}$$
* **`rescindByPlayer()` / `rescindByClub()`**: Triggers contract termination. 
  * If before 182.5 days (half-time), a **65% penalty** is applied to the caution and sent to the non-rescinding party.
  * If after 182.5 days, no penalty is applied; the caution returns 100% to the club.
* **`expireContract()`**: Can be executed after 365 days. Releases 100% of the caution escrow back to the club.
* **`transferClub(newClub)`**: Transfers the club role to a new address. Updates the owner of the vault and transfers all club shares to the new club.
