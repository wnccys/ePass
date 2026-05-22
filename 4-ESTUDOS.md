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