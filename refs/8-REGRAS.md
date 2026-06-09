# ePass: Architectural Guidelines & Development Rules

This document outlines the core architectural choices, coding standards, and development workflows for the **ePass** project. It serves as a reference guide for developers and AI agents.

---

## 1. General Principles
* **Simplicity & Safety**: The code should prioritize readable structures, minimal states, and strong cryptographic verification over complex, ad-hoc abstractions.
* **Separation of Concerns**: The smart contracts (`/smart-contracts`) govern on-chain settlement, ownership, and financial terms. The web platform (`/epass-web`) manages metadata indexing, user profiles, OAuth authentication, and UI rendering.

---

## 2. Project Structure & Workspaces
* **Package Manager**: **pnpm** (version 11.x) is used.
* **Directory Layout**:
  * `/smart-contracts`: The Solidity smart contract directory (managed with Foundry).
  * `/epass-web`: The Next.js 16/React 19 frontend directory.

---

## 3. Database Guidelines
* **Database Engine**: **MongoDB** connected via **Mongoose**.
* **Model Responsibilities**:
  * Track off-chain metadata (such as contract drafts, athlete details, and user email identities).
  * Do **not** store any private keys, contract seed phrases, or sensitive Web3 credentials.
  * Map OAuth profiles to verified on-chain wallet addresses.

---

## 4. Primary Libraries & Core Tech Stack
* **UI & Styling**: **TailwindCSS v4** (configured via CSS variables/OKLCH themes inside `app/globals.css`) and **Shadcn UI** components.
* **Internationalization**: **i18next** (configured for dual English/Portuguese dashboard layouts).
* **Web3 Integration**: **Viem** and **Wagmi** hooks.
* **Forms & Verification**: **Tanstack-Form** (required for form states) and **Zod** (for schema validation).

---

## 5. CI/CD & Code Quality
* **Code Formatting**: **Biome** is the mandatory formatter and linter. Biome checks are executed in the CI pipeline scoped specifically to `/epass-web`.
* **Build Verification**:
  * Smart contracts are built and validated in CI using `forge build`.
  * Frontend builds are validated in CI using `pnpm build` (running under node 20 and pnpm v11).

---

## 6. Frontend Component & Form Standards
* **Shadcn UI Preference**: All UI elements should prioritize Shadcn UI primitives over raw HTML tags to maintain design consistency.
* **Form Logic**:
  * All user forms must use `@tanstack/react-form`.
  * Form validations must be declared using **Zod** schemas.
  * Avoid raw input states; map inputs directly through the Tanstack-Form controller.

---

## 7. Authentication & Wallet Association
* **OAuth Boundary**: Authentications must run through **NextAuth** configured with a Google OAuth provider.
* **Wallet Separation**:
  * Wallet addresses must not be persisted directly inside core authentication parameters in MongoDB.
  * Wallet connections are verified on-chain and bound dynamically to the NextAuth JWT session.
  * Upon user sign-out, session cookies are cleared, and the Web3 connection state is fully flushed.

---

## 8. Smart Contract Development Standards
* **Solidity Version**: `^0.8.24` compiled via **Foundry**.
* **ABI Bindings**: Frontend interfaces are generated using **Wagmi-CLI** (`pnpm wagmi`) to maintain typed hook bindings.
* **Security & Clean Code**:
  * Every state-changing function must strictly follow the **Checks-Effects-Interactions (CEI)** pattern.
  * All external payment and transfer functions must inherit and apply OpenZeppelin's `nonReentrant` guards.
  * Vault deployments must use the **EIP-1167 Minimal Proxy** standard to optimize gas consumption during scaling.
  * Off-chain signatures must follow the **EIP-712** typed data specification.