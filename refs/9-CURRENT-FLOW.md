# ePass Contract Lifecycle Flow

This document details the exact sequence of on-chain operations required to formalize, activate, and manage the lifecycle of an image rights agreement.

---

## 1. The Pre-requisite: Step 0 (Off-Chain Agreement & Minting)

Before any vault operations can begin, a Master NFT representing the player contract must be minted:
1. **Drafting**: The club creates a contract draft containing the metadata and the legal PDF IPFS hash.
2. **EIP-712 Signing**: The Player, Club, and Attorney sign the structured EIP-712 data off-chain using their Web3 wallets.
3. **Execution**: The Club calls `executeMint()` on the [RightsMinter](file:///home/wnccys/Progs/ETH/ePass/src/smart-contracts/src/RightsMinter.sol) contract, submitting the signatures.
4. **Minting**: The contract verifies the signatures and instructs [PlayerRightsMaster](file:///home/wnccys/Progs/ETH/ePass/src/smart-contracts/src/PlayerRightsMaster.sol) to mint the Master NFT to the Club.

---

## 2. The 5 Steps to Activate a Vault

Once the Master NFT is owned by the Club, it can be fractionalized and activated:

```
[NFT Minted to Club]
       │
       ▼ (Step 1: Deploy Vault Proxy)
RightsVaultFactory.createVault(player, club, attorney, playerBps, clubBps, attorneyBps)
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
RightsVault.depositCaution(cautionAmount)   <--- Status becomes ACTIVE 🚀
  - OR -
RightsVault.depositAndMint(totalAmount)     <--- Alternative: splits caution/reserve
```

### Step 1: Deploy the Vault Proxy Clone
The Club calls `createVault(...)` on the [RightsVaultFactory](file:///home/wnccys/Progs/ETH/ePass/src/smart-contracts/src/RightsVaultFactory.sol) contract.
* **Inputs**: Wallet addresses of the Player, Club, and Attorney, and their percentage share splits in Basis Points (BPS) (e.g., `3000`, `6000`, `1000` representing `30%`, `60%`, `10%` — totaling `10,000` BPS).
* **Action**: Factory deploys a lightweight EIP-1167 minimal proxy clone of [RightsVaultImpl](file:///home/wnccys/Progs/ETH/ePass/src/smart-contracts/src/RightsVaultImpl.sol), sets status to `PENDING` (`0`), and returns the dynamic `vaultAddress`.

### Step 2: Approve the NFT for the Vault
* **Action**: The Club calls `approve(vaultAddress, tokenId)` on the [PlayerRightsMaster](file:///home/wnccys/Progs/ETH/ePass/src/smart-contracts/src/PlayerRightsMaster.sol) (ERC-721) contract. This authorizes the new Vault proxy clone to retrieve the NFT.

### Step 3: Fractionalize Shares
* **Action**: The Club calls `fractionalize(tokenId, supply)` on the **Vault Clone** contract.
* **Effect**: The Vault pulls the Master NFT and locks it in storage. It then mints `supply` of `$P_IMAGE` ERC-20 tokens, distributing them dynamically between the Player, Club, and Attorney according to the BPS defined in Step 1.

### Step 4: Approve the Caution Deposit
* **Action**: The Club calls `approve(vaultAddress, cautionAmount)` on the `MockUSDC` (ERC-20) contract, giving the Vault permission to pull the required caution money.

### Step 5: Deposit Caution & Activate (Two Options)
* **Option A: Pure Caution (`depositCaution`)**:
  * The Club deposits `cautionAmount` of stablecoin (USDC).
  * **Effect**: The Vault pulls the USDC, records the starting block timestamp (`contractStart`), and sets the status to **`ContractStatus.ACTIVE`** (`1`).
* **Option B: Dynamic Deposit & Mint (`depositAndMint`)**:
  * The Club deposits a `totalAmount` of stablecoin.
  * **Effect**: The Vault splits the deposit: **50%** is added to the locked `cautionAmount` and **50%** is added to `redeemableReserve`, minting new shares of equivalent value back to the Club. Sets status to **`ContractStatus.ACTIVE`** (`1`).

---

## 3. The Rescission & Expiration Lifecycle

Once the contract is `ACTIVE`, the caution money is held in escrow by the Vault clone. The next steps depend on how the contract terminates:

### Case A: Rescind by Player (`rescindByPlayer()`)
* **Before 6 Months** (Half-Time + 1 day buffer): A penalty applies to the player. The Vault sends **65%** of the USDC caution back to the **Club**, and **35%** is returned to the **Player**.
* **After 6 Months**: No penalty. The Vault returns **100%** of the USDC caution back to the **Club**.

### Case B: Rescind by Club (`rescindByClub()`)
* **Before 6 Months**: A penalty applies to the club. The Vault sends **65%** of the USDC caution to the **Player**, and **35%** is returned to the **Club**.
* **After 6 Months**: No penalty. The Vault returns **100%** of the USDC caution back to the **Club**.

### Case C: Expiration (`expireContract()`)
* **After 12 Months** (365 days + 1 day buffer): The contract completes naturally. Anyone can call `expireContract()`, which sets the status to `EXPIRED` (`3`) and returns **100%** of the caution money to the **Club**.

---

## 4. Post-Activation Operations

### Share Redemption (`redeem()`)
* **Action**: Any `$P_IMAGE` token holder can call `redeem(shares)` at any time once the contract is no longer `PENDING`.
* **Effect**: The Vault burns the specified number of shares and returns a proportional amount of the stablecoin `redeemableReserve` to the caller:
  $$\text{stablecoinAmount} = \frac{\text{shares} \times \text{redeemableReserve}}{\text{totalSupply}}$$

### Athlete Transfer (`transferClub()`)
* **Action**: The Club can call `transferClub(newClub)` to trade the player's contract.
* **Effect**: The Vault sets `club = newClub`, sets the status to `TRANSFERRED` (`4`), and transfers all remaining shares owned by the old club to the new club's address.
