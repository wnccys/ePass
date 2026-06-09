# Developer Getting Started & Implementation Roadmap

This document serves as the developer portal for the **ePass** project. It details our core technology stack, project setup, database configurations, local dev environments, and implementation workflows.

---

## 1. Core Technology Stack

The ePass monorepo relies on:
* **Node.js `v22.22.2`**
* **pnpm `v11.5.1`**

The ePass monorepo is divided into two primary directories:

### Backend & Smart Contracts (`/smart-contracts`)
* **Solidity `^0.8.24`**: Core smart contracts.
* **Foundry**: Compilation, unit testing, and deployment scripts.
* **OpenZeppelin**: Secure standards (ERC-20, ERC-721, EIP-712).
* **IPFS (Pinata SDK)**: Legal document storage.

### Frontend Application (`/epass-web`)
* **React 19 & Next.js 16 (App Router)**: Client and server components.
* **Tailwind CSS v4 & PostCSS**: Theme and custom OKLCH tokens.
* **Shadcn UI**: Design presets and component primitives.
* **Wagmi & Viem**: Web3 hooks and JSON-RPC node provider wrappers.
* **Biome**: Automated code formatting and linting.

---

## 2. Local Development Environment Setup

To simulate the entire hybrid architecture locally, run the following components:

### 1. Database (MongoDB)
Start a local MongoDB instance and Compooss explorer using Docker:
```bash
docker compose -f src/docker-compose.yml up -d
```
* **MongoDB**: Runs on port `27017`.
* **Compooss (Web Viewer)**: Accessible at `http://localhost:6969`.

### 2. Local Blockchain Node (Anvil)
Run a local EVM simulation node to deploy and interact with smart contracts:
```bash
anvil
```

### 3. Local Block Explorer
Explore transactions and contracts locally via the custom built explorer:
* Navigate to `/explorer`, install dependencies using **yarn**, and start the development server with **dev**:
  ```bash
  cd explorer
  yarn install
  yarn dev
  ```

---

## 3. ABI Bindings & wagmi-cli
We auto-generate typed React hooks directly from Solidity ABIs.
1. Make sure your local anvil node is running and contracts are compiled.
2. Run the code generation tool:
   ```bash
   pnpm wagmi
   ```
This updates the generated files under `src/epass-web` to sync the React frontend hooks with any smart contract code changes.

---

## 4. Internationalization (i18n)
Translations are managed via `i18next` inside `src/epass-web`. 
* Files are localized for English (`en`) and Portuguese (`ptBr`).
* Translate core Web3 buttons, onboarding inputs, SIWE connection dialogs, and contract metric widgets.
