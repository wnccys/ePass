# Study

This file exposes how the project works in this specific study branch.

## Rights Minter

Works by creating the MintAgreement structure, which can be signed (and must) by multiple defined persons.
The main function here is executeMint() which checks the signatures and call mintRights(club, URI), what effectivelly registers the NFT for the club.

* constant MINT_AGREEMENT_TYPEHASH => Defines the shape of the transaction the contract will receive (this transaction is multi-signed).
    * Basically defines the exact structure of a data packet a user is going to sign off-chain with their wallet (like MetaMask)
    * keccak256 is used to create a hash, which will be used later for check:
        * The user actually signed this specific piece of data.
        * Nobody modified the data (like changing the player address or the deadline) after it was signed.

* _hashTypedDataV4: This OpenZeppelin function automatically handles the EIP-712 Domain Separator.
It ensures that a signature meant for this contract on the Ethereum Mainnet cannot be reused on an identical contract deployed to Arbitrum or a testnet.

* abi.encode(...): The abi.encode function takes all the separate pieces of data and squashes them into one continuous stream of bytes.
To do this correctly according to the EIP-712 standard, it follows a strict order:
    * First: It passes the MINT_AGREEMENT_TYPEHASH. This tells the cryptographic algorithm, "Hey, the data following this matches the exact template we defined earlier."
    * Next: It passes the actual values for the player, club, attorney, nonce, and deadline in the exact order they were declared in the template.

* Nonces: By inheriting Nonces and using _useCheckedNonce(req.player, req.nonce), we guarantee that a specific agreement can only be executed exactly once.
The nonce state is tied to the player's address.

### _getDomainSeparator([...]) & _getDigest([...])

Domain Separator is a pattern to prevent replay attacks on ERC-712 contracts. It acts like a guarantee the contract can only be executed on a choosen contract.
This way the signatures can't be twisted maliciously.

Digest is the final packed data // TODO

## Player Rights Minter

The contract whose effectively delegate the NFT to the club after the contract has been signed correctly by all the required parts (after checking the signatures).

## Token Factory

1. Should you use a Token Factory?
Yes, absolutely. If you combine a superstar's contract with a rookie's contract into a single liquidity pool, you destroy the market. Investors want to speculate on specific assets.

To scale this, you need a Vault Factory (or Token Factory) smart contract.

How it works: Instead of hardcoding one vault, you write a VaultFactory.sol. Every time a new Master NFT is minted, the Club calls VaultFactory.deployVault(tokenId).

The output: The factory automatically generates a brand new, isolated ERC-20 smart contract just for that player (e.g., $P_NEYMAR with its own supply and price) and locks the NFT inside it.

Pro tip: Use the EIP-1167 Minimal Proxy Pattern for your factory. Deploying a whole new ERC-20 contract for every player costs a lot of gas. A Proxy Factory deploys lightweight "clones" that point to a single master logic contract, reducing your deployment costs by ~90%.


3. Raw Signatures vs. Multisig: Which do you use?
You don't choose between them—you use both, but for different people.

The real-world entities in your system have different security needs. A football player is an individual; the Club SPV is a corporate entity.

Here is how you structure the architecture:

The Player & Attorney (Individuals): Use Raw EIP-712 Signatures.
The player is sitting on their couch using an iPhone. They just want to open an app, read the terms, and click "Sign." The EIP-712 flow we discussed earlier is perfect for them. It costs no gas and proves their consent.

The Club SPV (Corporation): Use a Multisig (Safe).
The SPV is the entity actually executing the transaction on-chain and holding the Master NFT. It cannot be controlled by a single private key.

The Complete Scalable WorkflowHere is exactly how the raw signatures and the multisig work together to mint and fractionalize a contract:

1. Individuals Sign (Off-Chain):EIP-712 Signatures.
The Player and the Attorney review the contract on your frontend.
They each sign the EIP-712 digest using MetaMask/WalletConnect.
These raw signatures are saved to your backend database.

2. SPV Proposes the Transaction: Inside the Safe.
One of the SPV board members logs into the Gnosis Safe dashboard.
They propose a transaction to call mintAgreement() on your smart contract, attaching the Player and Attorney's raw signatures as data payload.

3. SPV Board Approves: Multisig Consensus.
The other SPV board members review the proposed transaction.
3 out of 5 of them must sign the transaction within Gnosis Safe to approve it.

4.Execution & Minting: On-Chain Settlement.
Once the threshold is met, the Safe submits the transaction to the blockchain, paying the gas.
The smart contract uses ecrecover to verify the attached raw signatures from Step 1.
If valid, the NFT is minted directly into the Safe's vault.

# RWA Securitization Flow: Football Player Image Rights

This document outlines the architectural breakdown, optimal ERC standards, and step-by-step execution flow for the tokenization of a football player's image rights and future receivables. By tokenizing these rights, an on-chain bond is issued, backed by the future cash flow of brand deals and sponsorships.

## 1. ERC Standards: Options & Trade-offs

Choosing the right token standard dictates how DeFi protocols can interact with the asset.

| Standard | Architecture | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **ERC-721 (NFT)** | One token represents the exact legal contract (1:1). | Perfectly maps to a unique legal PDF. Easy to implement metadata pointing to IPFS. | **Illiquid.** You cannot borrow *partial* value in most DeFi lending protocols; it's all or nothing. |
| **ERC-1155 (Multi-Token)** | One token ID represents the player, with a supply representing "shares" of the contract. | Allows fractional ownership natively. Investors can buy 10% of the player's image rights. | Less standard support in legacy DeFi lending markets compared to pure ERC-20s. |
| **ERC-3525 (Semi-Fungible)** | Tokens have unique IDs (like 721) but contain a quantitative `value` slot (like 20). | **Ideal for financial bonds/receivables.** You can split, merge, and transfer *values* of the image rights between wallets. | Requires custom adapters for standard DEXs and lending pools. |
| **Fractionalized (ERC-721 → ERC-20)** | ERC-721 is locked in a vault, which issues ERC-20 tokens representing shares. | **Maximum liquidity.** ERC-20s easily plug into Uniswap or Aave-style lending pools. | High architectural complexity. Extreme regulatory risk (functions exactly like an unregistered security). |

**Recommendation for a Fintech PoC:** Use the **Fractionalized approach (ERC-721 locked into an ERC-20 vault)** or **ERC-1155**. They provide the easiest integration into existing liquidity pools to release immediate capital.

---

## 2. The End-to-End Execution Flow

The securitization of an RWA requires a strict, ordered process where failure at one step invalidates the asset. Here is how the flow operates after the legal terms are agreed upon.

### Step 1: The Legal Wrapper (SPV)
A Special Purpose Vehicle (SPV) must be created off-chain. The player signs the rights over to the SPV. The smart contract doesn't own the player; the smart contract owns the SPV, which holds the legal rights.

### Step 2: Multi-Sig Authorization (ERC-712 & Safe)
The transaction to mint the tokenized asset is queued. Because multiple parties must agree, you utilize a **Safe (formerly Gnosis Safe)** smart account. The Player, Attorney, and the Club provide structured off-chain signatures using **ERC-712** to verify their intent. Once all signatures are collected, the transaction is executed on-chain.

### Step 3: Minting the Asset
The Smart Contract verifies the ERC-712 signatures. If valid, it mints an ERC-721 representing the master contract. This NFT is immediately deposited into a **Vault Contract**.

### Step 4: Fractionalization & Collateralization
The Vault Contract mints ERC-20 tokens (e.g., `$P_IMAGE`) representing fractional shares of the future receivables. The Club takes these ERC-20 tokens and deposits them into a DeFi Lending Pool (like a custom Aave fork).

### Step 5: Liquidity Release
The lending pool accepts `$P_IMAGE` as collateral and releases stablecoins (USDC) to the Club, providing immediate capital.

### Step 6: Yield Repayment
As the player generates real-world revenue (Nike deals, TV spots), fiat is paid to the SPV, converted to USDC, and routed back to the Vault Contract. The Vault distributes this yield proportionally to whoever holds the `$P_IMAGE` tokens (or uses it to pay down the Club's stablecoin loan).

---

## 3. Tracking the Player's Value on Ethereum

Value tracking in RWAs operates on two distinct vectors: **Speculative Value** and **Yield Value**.

### Speculative Value (AMM Price)
If you create an ERC-20 liquidity pool (`$P_IMAGE` / `USDC`) on a decentralized exchange like Uniswap, the free market dictates the value.
* If the player scores a hat-trick in a final, demand for their token increases, and the AMM price rises.
* To track this securely on-chain for your lending pool to calculate liquidation thresholds, you would use a **TWAP (Time-Weighted Average Price)** oracle directly from the Uniswap V3 pool.

### Yield Value & Performance Oracles
You can link the player's real-world performance directly to the contract's financial mechanics using a custom EVM Oracle architecture. Instead of just tracking goals, the Oracle node fetches data from sports APIs and social media metrics to update the on-chain state:

* **Dynamic Interest Rates:** The smart contract can be programmed so that if the Oracle reports the player reached 10 million Instagram followers, the interest rate the Club pays on their DeFi loan decreases (because the collateral is now considered "safer" or more valuable).
* **Performance Dividends:** If the player hits specific milestones (e.g., winning the Ballon d'Or), the Oracle triggers a pre-programmed bonus payout from the Club's treasury to the token holders.