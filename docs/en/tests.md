# Automated Testing Guide

ePass features a robust and automated testing suite to guarantee the reliability of all business rules on-chain (smart contracts) and off-chain (frontend and integrations). The testing pipeline is divided into three main layers: on-chain unit tests, client unit/integration tests, and end-to-end behavior-driven development tests (E2E/BDD).

---

## ⛓️ 1. Smart Contract Testing (Foundry)

On-chain tests are developed using **Foundry (Forge)**, enabling high-performance Solidity assertions and realistic EVM simulations.

### Test Structure (`src/smart-contracts/test/`)

#### A. `PlayerRightsMaster.t.sol` (Master NFT)
Focuses on testing the lifecycle of the ERC-721 token representing image rights.
* **Authorized Minter**: Ensures only the `RightsMinter` gateway is allowed to mint new NFTs. Mint attempts from regular accounts must fail with `CallerNotAuthorized()`.
* **Restricted Direct Transfers**: Validates the "soulbound" rule where direct transfers via `transferFrom` or `safeTransferFrom` are blocked unless the caller is an explicitly authorized operator (`authorizedOperators`).

#### B. `RightsMinter.t.sol` (EIP-712 Gateway)
Verifies the off-chain cryptographic signature flow and multi-signature authorization.
* **Triple Signature Validation**: Generates valid signatures for the player, club, and attorney using local private keys. The test checks if `RightsMinter` successfully recovers signers via `ecrecover` and triggers the mint.
* **Deadline Protection**: Simulates an agreement transaction submitted after the specified `deadline`, verifying that the transaction reverts with `SignatureExpired()`.
* **Signature Replay Protection**: Executes the same agreement structure twice, verifying that the second call fails with `AgreementAlreadyExecuted()`.

#### C. `RightsVault.t.sol` (Escrow Vault)
Tests the complete financial logic of minimal proxy clones: deposits, durations, fractional shares, and penalty calculations.
* **Asset Fractionalization**: Validates the minting of the `$P_IMAGE` ERC-20 utility token and its exact distribution according to configured basis points (`playerShares`, `clubShares`, and `attorneyShares`).
* **Escrow Termination Rules**:
  * **Before 6 Months**: Simulates premature contract termination, mathematically validating that the caution deposit is split at a 65%/35% penalty ratio.
  * **After 6 Months**: Simulates termination after the first half, verifying that 100% of the caution amount is returned to the club.
* **Contract Expiration**: Simulates time progression (`vm.warp`) to 365 days + 1 day buffer to call `expireContract()`, verifying that the caution deposit is fully refunded.
* **Reentrancy Protection**: Simulates malicious reentrant callback vectors on withdrawals, verifying that the `nonReentrant` modifier prevents exploitation.

**Command to Run:**
```bash
cd src/smart-contracts
forge test -vv
```

---

## 🖥️ 2. Frontend Testing (Vitest)

The client side leverages **Vitest** for quick validations of helper utilities, React hooks, and form formatting rules.

### Test Structure (`src/epass-web/__tests__/`)

* **`validations.test.ts` (Form Validations)**:
  * Ensures form fields reject invalid Ethereum addresses.
  * Validates that individual basis points allocations between player, club, and attorney sum up to exactly `10,000` (100%).
* **`utils.test.ts` (Global Utilities)**:
  * Unit tests string parsers, hash formatters, and mathematical `BigInt` scaling calculations (converting wei to USDC decimal representations).
* **`web3/eip712.test.ts` (Cryptographic Payloads)**:
  * Verifies the client-side generated JSON structure for the EIP-712 typed domain and data matching the smart contract type definitions.
* **`web3/contracts.test.ts` (Contract Interactions)**:
  * Mocks RPC node responses and tests the behaviour of custom Wagmi and Viem hooks, checking loading states, query successes, and network exceptions.

**Command to Run:**
```bash
cd src/epass-web
pnpm run test
```

---

## 🎭 3. End-to-End & BDD Testing (Playwright)

For real-world user interaction simulations, ePass uses **Playwright** combined with **playwright-bdd** (Gherkin/Cucumber format) to automate end-to-end workflows in a headless browser.

### Behavior Scenarios (`src/epass-web/e2e/features/`)

#### A. Authentication (`auth.feature`)
```gherkin
Feature: User Authentication
  Scenario: Successful login using Web3 wallet (SIWE)
    Given the user is on the landing page
    When they click on "Connect Wallet"
    And sign the cryptographic login message (SIWE)
    Then the session should be established and the dashboard should become visible
```

#### B. Navigation (`navigation.feature`)
* Validates NextAuth middleware route guards, confirming that unauthenticated users attempting to access dashboard routes are redirected back to the login page.

#### C. Agreement Creation Pipeline (`new-contract.feature`)
* Simulates the complete registration flow: filling out the agreement parameters, uploading the PDF document, triggering the web3 provider wallet modal (mocked client confirmations), recovering from three signatures, sending the transaction to the `RightsMinter` smart contract, and checking database synchronizations (MongoDB).

**Command to Run:**
```bash
cd src/epass-web
pnpm run test:e2e
```
