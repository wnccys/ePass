# Use of Artificial Intelligence (AI)

This document describes how artificial intelligence was integrated into the development process of **ePass** as a co-pilot and technical aid tool.

---

## 🛠️ Tools Used

During the conception, validation, and coding of the platform, the following AI solutions were used:
1. **Groq** (with Llama-3/Mixtral models for fast reference searches and quick queries).
2. **Gemini** (for deep file contextualization, global code ecosystem analysis, and data structuring).
3. **Claude Code** / **Claude** (as an active coding assistant and direct pair programming in the terminal and editor).

---

## 🎯 How AI was Used

AI was used strategically and in a controlled manner, acting mainly in three fronts:

### 1. Research of Possibilities and Patterns
Before writing any critical code, we used AI to map the design space and research consolidated patterns in the Ethereum/EVM community. This included queries on:
* Technical viability of using minimal proxy clones (**EIP-1167**) to lower the deployment cost of multiple *Escrow Vaults*.
* Structuring and secure off-chain digital signing using the **EIP-712** standard.
* Best practices for integrating Web3 React interfaces (Wagmi/Viem).

### 2. Idea Validation and Business Modeling
We used the tools to debate the platform's financial guarantee and custody model:
* Validation of the distribution mechanism of shares and allocation of the caution deposit (USDC).
* Analysis of the viability of early termination rules (6-month penalty period / HALF_TIME) from the perspective of Smart Contracts state flows.

### 3. Directed Implementation and Refactoring
**AI did not replace the group's decision-making.** Instead, the team discussed the scope in detail, designed the architecture, and specified the desired business rules. With the specification in hand, we asked the AI for:
* Gating code templates and UI components using the project's design system.
* Systematic translation of pages with internationalization (such as the `i18n.ts` flow).
* Specific refactorings to resolve TypeScript/Next.js linter warnings.

---

## 🎓 Team Ownership and Understanding

> [!IMPORTANT]
> **Every single line of code, smart contract logic, network architecture decision, or interface flow present in this repository was widely discussed, understood, and assimilated by the group members.**
>
> Any member of the team is fully capable of detailing, justifying, debugging, or rewriting the component parts of the ePass project for the evaluation panel, demonstrating complete technical mastery over the constructed solution.
