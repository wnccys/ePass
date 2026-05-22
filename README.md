# ePass

Este documento representa o README final.

- [] o problema de impacto que pretende resolver;
- [] qual ação social, ambiental ou comunitária será registrada;
- [] quais evidências serão usadas;
- [] como a blockchain entra na solução;
- [] como os smart contracts automatizam validações, certificações ou reconhecimentos;
- [] como o histórico pode ser auditado;
- [] qual seria a aplicação prática em um cenário real.

## Arquitetura

## Design

## Interações

## Organização de Pastas

## Fluxo Geral

+--------------------+        1. Request Voucher        +--------------------+
|                    | -------------------------------> |                    |
|                    |                                  |                    |
|                    |        2. Return Voucher         |  Central Database  |
|                    |        & Creator's Signature     | (Holds the signed  |
|                    | <------------------------------- |     metadata)      |
|   Marketplace      |                                  +--------------------+
|   Web Frontend     |
| (React/NextJS app) |                                  +--------------------+
|                    |        3. Send Transaction       |                    |
|                    | -------------------------------> |  Buyer's MetaMask  |
|                    |   (Calls contract.redeem())      |  (Asks for gas &   |
|                    |                                  |   purchase price)  |
|                    | <------------------------------- +--------------------+
|                    |        4. User Approves & Broadcasts
+---------+----------+
          |
          | 5. Transaction Sent
          v
+--------------------+
|                    |
| Ethereum Network   | ---> Contract runs _safeMint()
|                    |
+--------------------+

## The Role of Domain Separator

Step 1: Calculate the Domain Separator Hash (Your Code)
[Domain Separator] = keccak256( abi.encode( "EIP712Domain...", "RightsMinter", "1", block.chainid, address(gateway) ) )

Step 2: Calculate the Voucher Hash (The Transaction Data)
[Voucher Hash] = keccak256( abi.encode( VOUCHER_TYPE, tokenId, price ) )

Step 3: Glue them together (The EIP-712 Standard Formula)
[Final Message Hash] = keccak256( abi.encodePacked( "\x19\x01", [Domain Separator], [Voucher Hash] ) )

Step 4: Check the Signature
address signer = ecrecover([Final Message Hash], signature);

## Ferramentas

Normally, if a Player, Club, and Attorney need to agree to something on Ethereum, they would each have to open MetaMask, pay a gas fee, and click "Submit Transaction". That means 3 separate transactions, 3 gas fees, and a messy user experience.