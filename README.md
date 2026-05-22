# ePass

// STUB Este documento representa o README final.

- [x] O problema de impacto que pretende resolver;
    Somos uma startup que apresenta uma solução social para jogadores começando suas carreiras e clubes, que buscam fazer negócios de forma **confiável**, **barata** e ter mais **visibilidade** no meio.

- [x] Qual ação social, ambiental ou comunitária será registrada;
    Ação social.

- [x] Quais evidências serão usadas;
    Evidências estatísticas e lógicas.

- [x] Como a blockchain entra na solução;
    Age como um ponto central de confiança. O motor que automatiza execução e garante segurança.

- [x] Como os smart contracts automatizam validações, certificações ou reconhecimentos;
    Com sistema de Locks e NFTs.

- [x] Como o histórico pode ser auditado;
    Via aplicação e com ferramentas de visualização on-chain.

- [x] Qual seria a aplicação prática em um cenário real;
    Completa. Se aproveitando de todo fluxo e produto que oferecemos.

## Nosso trabalho

* Perfil de Jogador e Clube
    * Jogador
        * O que é
            Representado por uma carteira, um jogador é efetivamente a carteira que receberá salários e abonos.

        * O que pode fazer
            * Visualizar
                * Clube atual
                * Outros clubes
                * Seu perfil

            * Contratos
                * Visualizar
                * Rescindir

    * Clube
        * O que é
            Representado por uma carteira multi-sig (Gnosis Safe), um jogador é efetivamente a carteira que receberá salários e abonos.

        * O que pode fazer
            * Apresentar uma lista concisa de jogadores
                * Lista que pode ser ordenada por preço, qualidade e outros atributos

            * Apresentar perfil individual dos jogadores
                * Qualidades, preço, e outras preferências contratuais
                    // TODO Á definir

                * Comprar jogadores
                    * Uma requisição de compra é aberta, uma transação é proposta
                        * Essa transação será avaliada pelo jogador, família, advogados, etc...
                            * Se assinada por todos:
                                *  O contrato é transformado em NFT, e liquidado em tokens que ficam disponíveis para compra.
                                    * O jogador pode receber uma porcentagem desses tokens, decididos via contrato.
                                    // TODO Definir como abonos, luvas etc... serão cobrados.

                            * Se não for concordada (tempo e assinaturas) por todos:
                                * O contrato expira e não pode ser executado.

                * Vender jogadores
                    * Uma requisição de compra é aberta, uma transação é proposta

Com esse recorte de fluxo, excluímos as necessidades de:

* Auditoria Contratual
* Criação de Carteiras

## Benefícios gerais

* Extinção de erros de intermediários
* Execução rápida após aprovação
* Burocracia desnecessária
* Acessível
* Transparente

## Benefícios para o Jogador

Garantia de contrato físico válido

## Benefícios para Clubes

Garantia de contrato físico válido

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


Atualmente o Fluxo se dá

### TODOs

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

Normally, if a Player, Club, and Attorney need to agree to something on Ethereum, they would each have to open MetaMask, pay a gas fee, and click "Submit Transaction".
That means 3 separate transactions, 3 gas fees, and a messy user experience.