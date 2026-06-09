# Business Rules & Analysis Cases: ePass Platform

This document defines the core business rules (Regras de Negócio) and analysis cases governing the smart contracts and frontend application logic of the **ePass** platform.

---

## 1. User Classification & Onboarding

### BR-101: Identity Mapping & Authentication
* **Rule**: User registration is initiated via Google OAuth. A user's profile is synced with their Google email address inside the database.
* **Analysis Case**:
  * If the user's email does not exist in the database upon successful OAuth, a new document is created with a default role of `'player'` and `onboardingComplete = false`.
  * The Mongoose `_id` is converted to a string and assigned to `session.user.id`.

### BR-102: Onboarding Constraints
* **Rule**: Access to core dashboard features is blocked until the onboarding form is successfully submitted.
* **Analysis Case**:
  * The profile page must render the `<OnBoardingForm />` if `onboardingComplete === false`.
  * Onboarding requires selecting a role (`'player'` or `'club'`) and verifying a connected Web3 wallet address.
  * Once submitted, the database sets `onboardingComplete = true`, and the NextAuth session is updated.

---

## 2. Agreement & Tokenization Lifecycle

### BR-201: Multi-Party Signature Verification
* **Rule**: Minting the Master NFT (representing the legal contract) requires three valid cryptographic signatures: the **Player**, the **Club**, and the **Attorney**.
* **Analysis Case**:
  * Signatures must be submitted as EIP-712 structured typed data.
  * The transaction must fail if the `block.timestamp` exceeds the agreement's `deadline`.
  * The transaction must fail if the signature recoveries (`ECDSA.recover`) do not match the expected addresses.

### BR-202: Replay Attack Protection (Nonces)
* **Rule**: Each `MintAgreement` must only be executed on-chain exactly once.
* **Analysis Case**:
  * The contract matches a unique cryptographic `nonce` tied to the player's address.
  * The execution hash (digest) is saved in the `executedAgreements` mapping. Any duplicate attempt will revert with `AgreementAlreadyExecuted`.

### BR-203: Master NFT Transfer Restrictions
* **Rule**: The Player Rights Master NFT must remain locked in the vault system and cannot be traded on secondary markets.
* **Analysis Case**:
  * The ERC-721 `_update` function reverts if `from` and `to` are non-zero addresses, unless the caller is in `authorizedOperators`.

---

## 3. Escrow Vault & Share Distribution

### BR-301: Vault Allocation (Basis Points)
* **Rule**: Upon locking the Master NFT, fractional ERC-20 shares are minted to the player, club, and attorney. The sum of their allocations must equal exactly 100%.
* **Analysis Case**:
  * The factory checks that `_playerBps + _clubBps + _attorneyBps == 10,000` (100.00%).
  * If the sum is not exactly 10,000, deployment reverts with `InvalidBasisPoints`.
  * Any rounding remainders during division are automatically assigned to the club's balance.

### BR-302: Deposit Splits (Caution vs. Reserve)
* **Rule**: Deposits made to fund the vault are split equally between a long-term caution escrow and a liquid redeemable reserve.
* **Analysis Case**:
  * The contract calculates `cautionPart = 50%` and `redeemablePart = 50%` of the deposited stablecoin (USDC) amount.
  * `cautionPart` is added to `cautionAmount` (escrow caution locked in the contract).
  * `redeemablePart` is added to `redeemableReserve` and mints an equivalent amount of ERC-20 shares back to the club.

### BR-303: Yield Redemption
* **Rule**: Token holders can redeem stablecoins in exchange for burning their shares at any time during active, rescinded, or expired states.
* **Analysis Case**:
  * The preview calculation for redemption is: `stablecoinAmount = (shares * redeemableReserve) / totalSupply()`.
  * Burned shares are subtracted from `totalSupply()` and the corresponding stablecoins are transferred to the redeemer.

---

## 4. Contract Termination & Early Rescission

### BR-401: Early Rescission Penalty (Before Half-Time)
* **Rule**: The contract has a set duration of 365 days. If either party breaks the contract before the half-time mark (182.5 days), a **65% penalty** is levied against the escrowed caution.
* **Analysis Case**:
  * The half-time check includes a 1-day buffer: `block.timestamp < contractStart + 182.5 days + 1 day`.
  * **If Player Rescinds**: 65% of the `cautionAmount` is transferred to the club. The remaining 35% is returned to the player.
  * **If Club Rescinds**: 65% of the `cautionAmount` is transferred to the player. The remaining 35% is returned to the club.

### BR-402: Late Rescission (After Half-Time)
* **Rule**: If either party breaks the contract after the half-time mark, no penalty is applied.
* **Analysis Case**:
  * The status updates to `RESCINDED`.
  * The full `cautionAmount` is returned back to the club's address.

---

## 5. Expiration & Athlete Transfers

### BR-501: Contract Expiration
* **Rule**: If the contract completes its full 365-day term, it can be expired.
* **Analysis Case**:
  * If `block.timestamp >= contractStart + 365 days + 1 day`, calling `expireContract` sets the status to `EXPIRED` and transfers the full `cautionAmount` to the club.

### BR-502: Player Transfers (Club Transfer)
* **Rule**: A club can transfer the contract to a new club (representing a player transfer).
* **Analysis Case**:
  * The new club address cannot be the zero address or the current club.
  * The vault's state updates `club = _newClub`, and the status transitions to `TRANSFERRED`.
  * All remaining ERC-20 shares held by the old club are transferred to the new club.