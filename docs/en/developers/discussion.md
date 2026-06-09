# General Project Discussions

This document compiles the core design discussions and architectural planning tasks completed during our development sessions.

## Completed Topics

* **Purchase & Agreement Flow**: Detailed the exact EIP-712 sequence of player/club/attorney authorization signatures and Gnosis Safe execution rules.
* **Requirements Formulation**: Cataloged functional requirements (FRs) for identity, contracts, and vault states, alongside non-functional requirements (NFRs) for signature safety and EIP-1167 minimal proxy gas optimizations.
* **Authentication Boundary**: Selected NextAuth with a Google OAuth provider synced to Mongoose profiles.
* **Web3 Session Binding**: Implemented a dynamic update trigger to verify and link connected Web3 wallet addresses to the JWT cookie session, keeping key credentials local.
* **Component Standards**: Standardized forms using `@tanstack/react-form` combined with **Zod** schema validations.
* **ABI Hook Bindings**: Configured Wagmi-CLI for automatic code generation of typed React hooks directly from compiled Foundry smart contract ABIs.
