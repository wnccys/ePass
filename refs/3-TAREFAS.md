# Project Implementation Roadmap: Tasks, Requirements, Screen Flow, & Tech Stack

This document details the completed tasks, functional and non-functional requirements, screen-by-screen feature breakdowns, and the technology stack utilized in the **ePass** application.

---

## 1. Technical Implementation Status (Completed Tasks)

### Backend & Smart Contracts
* **[x] Solidity Core Contracts**: Implemented the base agreement logic and EIP-712 validation.
* **[x] Foundry Suite**: Formulated unit testing and script deployments.
* **[x] OpenZeppelin Integration**: Inherited secure structures (ECDSA, Nonces, EIP712).
* **[x] IPFS Integrations**: Implemented backend routers connecting to Pinata SDK for secure PDF document storage.
* **[x] MongoDB Integration**: Connected database schemas to store off-chain user attributes and draft contracts.
* **[x] Local Blockchain Environment**: Integrated local nodes (Anvil) and custom block explorers (`./explorer`).

### Frontend & Application Architecture
* **[x] React 19 & Next.js 16 App Router**: Deployed dynamic routes and server components.
* **[x] Tailwind CSS v4 & PostCSS**: Integrated high-fidelity dark themes based on OKLCH tokens.
* **[x] Shadcn UI**: Customized UI elements using a tailored green/lime design preset.
* **[x] Internationalization (i18n)**: Implemented complete translations (English/Portuguese) across all layouts, dashboards, and SIWE screens.
* **[x] Web3 Providers**: Configured Wagmi and Viem hooks for React.
* **[x] CI/CD Pipeline Configuration**:
  * Set up GitHub Actions for Forge smart contract compiles.
  * Configured pnpm v11 workspace setups for Next.js builds.
  * Confirmed Biome CI workflows to automatically check and format code scopes restricted to `src/epass-web`.

---

## 2. System Requirements Specification

### Functional Requirements (FRs)

#### User Authentication & Role Setup
* **FR-1**: Users must be able to log in securely using Google OAuth via NextAuth.
* **FR-2**: Users must be assigned a role (`'player'` or `'club'`) during onboarding.
* **FR-3**: Users must be able to link and verify their Web3 wallet (e.g., MetaMask, Safe).

#### Contract Creation & Tokenization
* **FR-4**: Clubs must be able to create image rights contracts by supplying metadata (value, token name, token symbol, percent clause) and uploading a legal PDF to IPFS.
* **FR-5**: Players, attorneys, and club SPVs must sign the EIP-712 typed data off-chain to confirm consent.
* **FR-6**: The contract must verify the signatures on-chain and mint a corresponding ERC-721 token representing the legal agreement.

#### Escrow Vaults & Yields
* **FR-7**: Deployed agreements must be locked inside an ERC-1167 clone vault, emitting fractional ERC-20 tokens representing shares.
* **FR-8**: The vault must track and distribute USDC yield inputs back to fractional token holders.
* **FR-9**: The contract must enforce penalty deductions (e.g., 65% penalty if rescinded prior to 6 months).

---

### Non-Functional Requirements (NFRs)

#### Security & Integrity
* **NFR-1 (Signature Replay Protection)**: Signatures must use unique nonces and chain-specific domain separators (EIP-712) to prevent multi-chain replays.
* **NFR-2 (Secure Sessions)**: Authentication cookies must be HTTP-only and encrypted to prevent cross-site scripting (XSS) session theft.

#### Efficiency & Performance
* **NFR-3 (Gas Optimization)**: Contract deployment must utilize EIP-1167 Minimal Proxies to minimize gas consumption when generating individual player vaults.
* **NFR-4 (Off-Chain Coordination)**: Multi-party consent must be gathered off-chain via EIP-712 structured messages to avoid gas overhead prior to finalized execution.

---

## 3. Screen-by-Screen Layout Specifications

### 1. Landing Page (`/`)
* **Features**:
  * Animated grain gradient backdrop (`@paper-design/shaders-react`).
  * Public navigation header with call-to-actions.
  * Platform value propositions and features grids.

### 2. Onboarding Page (`/onboarding`)
* **Features**:
  * Role assignment selectors (Club vs. Player).
  * Web3 wallet association trigger (initiates dynamic signature verification).
  * Database update callback completing the NextAuth session setup.

### 3. Player Dashboard (`/home` & `/contracts`)
* **Features**:
  * **Summary Metrics**: Displays active contracts, pending signatures, and total locked valuations.
  * **Interactive Charting**: Visual representation of yield streams over time.
  * **Contract Drawer**: Sliding drawer containing the legal PDF preview, contract details, active statuses, and "Rescind" execution buttons.
  * **Profile Configuration**: Input forms for user avatar, displayed name, and connected wallet credentials.

### 4. Club Portal (`/athletes` & `/contracts/new`)
* **Features**:
  * **Athlete Directory**: Complete search/sort list of athletes based on contract parameters, prices, and metrics.
  * **Athlete Profiles**: Profile detailing player email, active escrow vaults, and contract parameters.
  * **Contract Builder**: Form inputs specifying player address, attorney address, token metrics, upload fields for PDF assets, and initial signature triggers.