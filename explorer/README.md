# ethui explorer

A **local-first blockchain explorer** built for **Anvil** and other local Ethereum networks.  
Inspect **blocks**, **transactions**, and **addresses** — then **simulate** and **execute** smart contract calls — all from your browser.

👉 **[Try it here](https://explorer.ethui.dev)**

---

## 🚀 Overview

`ethui explorer` combines the essentials of a blockchain explorer with the power of a local execution environment.  
It’s designed for developers who need to **see everything on their chain** and **interact with it directly**, without leaving the browser.

### Core Highlights

- **🔍 Explore Everything**
  - Navigate **blocks**, **transactions**, and **addresses** with detailed decoding.
  - Inspect calldata, events, and execution traces from local or remote RPCs.
- **🧱 Contract Editing**
  - Input or modify **ABIs** directly in the contract page using the **Edit ABI** button.
  - Decode transaction data instantly after ABI update.
- **⚡ Direct Executions**
  - Execute contract functions in real time through your **connected wallet**.
  - Works seamlessly with local RPCs for fast, reproducible testing.
- **🧪 Simulations**
  - Dry-run any transaction before sending it — validate outcomes instantly.
  - Ideal for debugging and verifying contract behavior pre-deployment.
- **🔌 RPC Connect**
  - Point the explorer to any Ethereum-compatible endpoint (optimized for **Anvil**).
- **🪶 Local-First**
  - All computation happens in your browser. No remote indexing, no data sharing.

---

## 🧩 How It Works

1. **Connect to your RPC**
   - Input your RPC URL (e.g. `http://localhost:8545`).
   - Best experience on **Anvil**.
2. **Explore the chain**
   - Browse **blocks**, **transactions**, and **addresses**.
   - Drill into transaction details and decoded contract calls.
3. **Edit ABIs**
   - On any contract page, click **Edit ABI** → paste your ABI to enable decoding and interaction.
4. **Simulate or Execute**
   - Run **read** and **write** calls directly.
   - Choose between **simulation** (dry-run) or **execution** (wallet broadcast).

---

## ⚙️ Example Setup (Anvil)

```bash
anvil --port 8545
