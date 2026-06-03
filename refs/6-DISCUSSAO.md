# Discussão Geral

Discussões para a noite.

## Current

### P1

#### Nonce

 A nonce (number used once) prevents Signature Replay Attacks.
    In a signature-based gateway like RightsMinter.sol, all parties (Player, Club, Attorney) sign a payload off-chain. Without a nonce:

    1. The Club submits the signatures on-chain to mint the NFT.
    2. The transaction succeeds.
    3. The Club (or anyone else) could copy those exact same signatures from the transaction history and submit them again to mint a duplicate NFT.

    By including  nonce  in the EIP-712 signed struct, and calling  _useCheckedNonce(req.player, req.nonce)  inside the contract:

    • The contract verifies that  req.nonce  matches the Player's current on-chain nonce.
    • During execution, the contract increments the Player's nonce.
    • Any future attempt to replay the same transaction will fail because the Player's on-chain nonce no longer matches the nonce in the signed payload.

####

## Done

* Definir fluxo de compra (clube-jogador)
* Definir fluxo de venda (clube-jogador)
* Definir fluxo de compra (clube-clube)
* Definir fluxo de venda (clube-clube)
* Definir requisitos funcionais
* Definir requisitos não-funcionais
* Definir fluxo de login/registro (tipos de contas, armazenamento (local/cloud), etc...)
* Definir telas e suas funções
* Tecnologias que vão ser usadas (DB, Wagmi/Viem etc...)
* Como as tecnologias vão ser usadas (o que cada uma faz no nosso projeto e como)
* Autenticação
* Autorização