# Club User Guide: Managing Player Contracts & On-Chain Assets

Welcome to the ePass Club Portal. This guide explains how football clubs can manage onboarding, issue player contracts, fractionalize rights, and manage the contract lifecycle.

---

## 1. Getting Started & Onboarding

To manage player contracts on ePass, your club must complete onboarding:
1. **Sign Up**: Sign up using your official club Google account via Google OAuth.
2. **Select Role**: Select **Club** as your account role.
3. **Link Wallet**: Connect your Web3 wallet address.
   * *Note*: As a corporate entity, we highly recommend linking your official **Safe (Gnosis Safe) Multisig Smart Account** address as the club wallet to ensure secure multi-signature corporate governance.

---

## 2. Creating a Contract

To tokenise a player’s rights, you must draft and execute a new agreement:
1. **Navigate to "New Contract"**: Open the contract creation form.
2. **Provide Details**:
   * Player wallet address and Attorney wallet address.
   * Total transfer value.
   * Split percentages in Basis Points (BPS) for the Player, Club, and Attorney (must sum to exactly 10,000 / 100%).
   * Custom Token Name and Token Symbol (e.g., `$P_NEYMAR`) for the fractional shares.
   * Contract duration and rescission clauses.
3. **Upload Document**: Upload the physical legal contract PDF. The backend uploads it to IPFS and returns the document hash (CID).
4. **Off-Chain Signing**: The Player and Attorney sign the agreement off-chain using their Web3 wallets (EIP-712 structured data).
5. **On-Chain Settlement**: Once signatures are gathered, propose and execute the transaction to mint the Master NFT representing the agreement.

---

## 3. Fractionalizing & Activating the Vault

Once the Master NFT is minted to your club's address, you can fractionalize the asset to unlock liquidity:
1. **Create the Vault**: Deploy a lightweight clone vault of the player rights.
2. **Approve NFT**: Authorize the new Vault proxy clone to pull the Master NFT.
3. **Fractionalize**: Call the `fractionalize` function on the vault. The vault locks the NFT in escrow and distributes the initial ERC-20 shares to the Player, Club, and Attorney according to the BPS defined in the contract.
4. **Activate the Contract**:
   * **Option A (Pure Caution)**: Deposit the required `cautionAmount` in stablecoins (USDC) to activate the contract.
   * **Option B (Deposit & Mint)**: Deposit stablecoins to split **50%** to locked caution and **50%** to the redeemable reserve, minting new shares of equivalent value back to your club.
   * *Status transitions to `ACTIVE`.*

---

## 4. Contract Lifecycle Management

### Yield Deposits & Redeems
* **Funding the Reserve**: Deposit additional stablecoins via `depositAndMint` to back the value of the player shares.
* **Redeeming Shares**: Burn your `$P_IMAGE` shares at any time to redeem their proportional value in USDC from the vault's redeemable reserve.

### Early Rescission (Termination)
* If the player breaks the contract before the half-time mark (182.5 days), you receive **65%** of the escrowed caution as a penalty.
* If you break the contract before the half-time mark, **65%** of the caution goes to the player as a penalty.
* If either party rescinds after the half-time mark, **100%** of the caution is returned to your club.

### Expiration
* After 365 days, you can trigger `expireContract` to close the contract naturally and withdraw **100%** of the caution escrow.

### Player Transfers (Club Transfer)
* Transfer the player asset to a new club by calling `transferClub(newClub)`. This updates the owner address of the vault to the new club and transfers all your remaining club shares to them.
