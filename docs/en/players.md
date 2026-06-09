# Player User Guide: Signing Contracts & Tracking Shares

Welcome to the ePass Player Portal. This guide explains how football players can complete onboarding, sign legal agreements off-chain, track their contract shares, and redeem funds.

---

## 1. Getting Started & Onboarding

To view and sign contracts on ePass, you must set up your profile:
1. **Sign Up**: Sign up using your Google account via Google OAuth.
2. **Select Role**: Select **Player** as your account role.
3. **Link Wallet**: Connect your Web3 wallet address (e.g., MetaMask or WalletConnect).
   * *Note*: This wallet is where you will receive your contract shares (tokens) and stablecoin redemptions.

---

## 2. Reviewing & Signing Contracts

When a club drafts a new agreement with you, it will appear on your dashboard:
1. **Navigate to "My Contracts"**: View pending agreements.
2. **Review PDF**: Click on the pending contract to open the legal PDF preview. Check the start date, end date, total value, split percentages, and token metadata.
3. **Sign Off-Chain**: 
   * Click **Sign Agreement**.
   * Your Web3 wallet will prompt you to sign a cryptographically structured message (EIP-712).
   * **No Gas Required**: Since this signature is off-chain, it does not cost any gas fees.
4. **Attaining Consent**: The agreement is saved in the database. Once you, the club, and your attorney have signed, the club will execute the contract on-chain to mint the Master NFT.

---

## 3. Tracking Shares & Redeeming USDC

Once your contract is activated on-chain:
* **Token Shares**: You will automatically receive your share of `$P_IMAGE` ERC-20 tokens directly in your linked Web3 wallet (according to the split percentage agreed upon in the contract, e.g., 30%).
* **Redeeming Yield**:
  * As sponsors, sponsors, or clubs deposit funding into the vault's reserve, your shares represent direct value.
  * You can call **Redeem** on your active contract dashboard to burn a portion of your `$P_IMAGE` tokens and withdraw their proportional value in USDC stablecoins.

---

## 4. Contract Termination & Rescission

### Early Rescission
* **Before 6 Months** (Half-Time): If you choose to rescind the contract early (before 182.5 days), a **65% penalty** is applied to the caution money escrow. 65% of the caution goes to the club, and you receive the remaining 35%.
* **After 6 Months**: No penalty is applied. The full caution money is returned to the club.
* *To execute this, click "Rescind Contract" on your active contract details page.*

### Contract Expiration
* After 365 days, the contract term ends naturally. The club can expire the contract, which returns the caution escrow to the club while keeping your earned token yields fully intact.
