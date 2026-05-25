# ePass ⚽

> **Tokenizando o primeiro contrato do atleta. Construindo carreiras desde o início.**

ePass é um protocolo descentralizado que transforma contratos de direito de imagem de jovens atletas de futebol em ativos registrados on-chain. Por meio de smart contracts, assinaturas multi-parte e um contrato DAO por atleta, o ePass garante transparência, segurança jurídica e um mecanismo real de valorização de mercado para jogadores que estão começando.

***

## O Problema

Quando um jovem atleta assina seu primeiro contrato profissional, dois documentos são produzidos: o contrato de trabalho e o contrato de direito de imagem. O segundo é praticamente uma folha em branco — não há padrão de registro, não há auditabilidade pública, e o atleta raramente entende ou controla o que está cedendo.

Além disso, jogadores em início de carreira possuem contratos de baixo valor nominal. Não existe nenhum mecanismo para que um talento emergente gere interesse de mercado antes de uma grande transferência. Eles dependem inteiramente da visibilidade que o clube decide — ou não — dar.

**O ePass resolve isso.**

***

## A Solução

O ePass digitaliza e registra o contrato de direito de imagem on-chain, com respaldo em IPFS. A partir disso, qualquer pessoa pode apoiar diretamente o atleta adquirindo tokens `$P_IMAGE` — um **certificado de apoio**, não um ativo especulativo. O valor doado entra no fundo do atleta, aumentando seu valor de mercado. Quem apoia acredita na carreira e ajuda o futuro do jogador!.

***

## Arquitetura de Smart Contracts

O protocolo é composto por quatro contratos interligados, deployados na **Sepolia Testnet**.

```
  MUNDO OFF-CHAIN
  ───────────────────────────────────────────────────────────────────
  
  [Contrato PDF]  ──hash──►  [IPFS]  ──URI──►  tokenURI do NFT
  
       │
       │  Jogador, Clube e Advogado
       │  assinam digitalmente (EIP-712, sem gas)
       ▼
  
  ───────────────────────────────────────────────────────────────────
  MUNDO ON-CHAIN
  ───────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────┐
  │                        RightsMinter                             │
  │                    (Gateway EIP-712)                            │
  │                                                                 │
  │  Recebe as 3 assinaturas (jogador + clube + advogado)           │
  │  Valida cada uma · Checa nonce e deadline · Dispara o mint      │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              │ executeMint()
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                    PlayerRightsMaster                           │
  │                      (ERC-721 NFT)                              │
  │                                                                 │
  │  Minta o NFT master para o clube                                │
  │  URI imutável aponta para os documentos no IPFS                 │
  │  Só pode ser mintado pelo RightsMinter                          │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              │ Clube chama a Factory
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                   ContractDAOFactory                            │
  │                                                                 │
  │  Recebe os parâmetros do contrato real (porcentagens,           │
  │  valor, partes, caução) e deploya um ContractDAO único          │
  │  por atleta — custeado pelo clube                               │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              │ deploy()  →  1 contrato por atleta
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                       ContractDAO                               │
  │               (Contrato único por atleta)                       │
  │                                                                 │
  │  STATUS: PENDING ──► ACTIVE (clube deposita caução)             │
  │                                                                 │
  │  Regras do acordo (espelhando o PDF):                           │
  │    · Divisão: Jogador X% · Clube Y% · Advogado Z%               │
  │    · Bonificação em $P_IMAGE tokens                             │
  │    · Rescisão com caução como proteção das partes               │
  │                                                                 │
  │  Emissão de $P_IMAGE  ──►  Certificados de Apoio                │
  │                                                                 │
  │    Apoiadores compram $P_IMAGE  ──►  valor entra no fundo       │
  │    do atleta  ──►  aumenta seu valor de mercado                 │
  │                                                                 │
  │    [ Jogador ]  ←── saca $P_IMAGE → converte fora do sistema    │
  └─────────────────────────────────────────────────────────────────┘

  TRANSFERÊNCIA DE CLUBE
  ───────────────────────────────────────────────────────────────────

  [Clube Atual]  ──transferFrom()──►  [Novo Clube]
       │
       └── NFT master é transferido · ContractDAO acompanha
           Histórico completo preservado on-chain
```

***

## Contratos

### `RightsMinter.sol` — Gateway de Autorização
Contrato central do fluxo de criação. Recebe as três assinaturas EIP-712 (jogador, clube, advogado), valida cada uma, previne replay attacks via nonces e deadline, e aciona o mint do NFT master somente quando **todos** os signatários aprovaram.

- `executeMint(agreement, playerSig, clubSig, attorneySig)` — valida e dispara o mint

### `PlayerRightsMaster.sol` — NFT Master (ERC-721)
Representa o contrato de direito de imagem do atleta como token não-fungível. URI imutável aponta para os documentos legais hasheados no IPFS. Só pode ser mintado pelo `RightsMinter`.

- `mintRights(recipient, uri)` — cria o NFT master

### `ContractDAOFactory.sol` — Factory de Contratos
Deployada uma vez. O clube a chama para criar um `ContractDAO` dedicado a cada atleta, passando os parâmetros reais do contrato físico. O custo do deploy é arcado pelo clube.

- `deploy(player, club, attorney, splits, caucion, tokenSupply)` — cria o ContractDAO do atleta

### `ContractDAO.sol` — Contrato por Atleta
O coração do protocolo. Espelha as regras do contrato físico on-chain. Controla o status do contrato, as regras de bonificação e rescisão, e a emissão dos tokens `$P_IMAGE`.

- `activate()` — clube deposita caução → status muda de `PENDING` para `ACTIVE`
- `mintSupportTokens(amount)` — emite tokens $P_IMAGE para apoiadores
- `claimBonus()` — jogador resgata bonificação em $P_IMAGE
- `rescind()` — inicia processo de rescisão conforme regras do caução

***

## O Token `$P_IMAGE` — Certificado de Apoio

O `$P_IMAGE` **não é um ativo especulativo**. Quem adquire um token está doando para o fundo do atleta, expressando confiança na carreira dele. O valor entra diretamente no montante do contrato, valorizando o jogador no mercado.

Não há expectativa de retorno financeiro para quem apoia. É um gesto — registrado, imutável e público na blockchain.

O atleta pode receber `$P_IMAGE` como bonificação e convertê-los para stablecoin fora do sistema, na própria carteira.

***

## Status do Contrato

| Status | Descrição |
|---|---|
| `PENDING` | Contrato mintado, aguardando depósito de caução do clube |
| `ACTIVE` | Caução depositada — contrato em vigor, tokens disponíveis |
| `RESCINDED` | Rescisão executada conforme regras do acordo |

***

## Fluxo Completo

**FASE 1 — ACORDO OFF-CHAIN**
Partes negociam. O contrato PDF é assinado. O documento é hasheado e enviado ao IPFS.

**FASE 2 — ASSINATURAS DIGITAIS (sem gas)**
Jogador, Clube e Advogado assinam o `MintAgreement` via EIP-712 em suas carteiras. Nenhuma transação on-chain ainda — apenas assinaturas coletadas.

**FASE 3 — MINT DO NFT MASTER**
As 3 assinaturas são submetidas ao `RightsMinter`. Validadas, o NFT master é mintado para o clube, com URI apontando para o IPFS.

**FASE 4 — DEPLOY DO CONTRATO DAO**
O clube chama a `ContractDAOFactory`, passando os parâmetros do contrato real. Um `ContractDAO` dedicado ao atleta é deployado.

**FASE 5 — ATIVAÇÃO (Caução)**
O clube deposita a caução no `ContractDAO`. Status muda de `PENDING` → `ACTIVE`. O contrato entra em vigor.

**FASE 6 — APOIO E VALORIZAÇÃO**
Tokens `$P_IMAGE` ficam disponíveis. Apoiadores compram tokens — o valor entra no fundo do atleta, aumentando seu valor de mercado.

**FASE 7 — TRANSFERÊNCIA (quando ocorre)**
O novo clube adquire o NFT master do clube atual via `transferFrom`. Histórico preservado. Novo `ContractDAO` é criado para o novo vínculo.

***

## Segurança

- **Replay Attack Prevention:** Nonces por endereço (`_useCheckedNonce` OZ v5) + `deadline` por transação
- **Typed Signatures:** EIP-712 — o usuário vê exatamente o que está assinando no MetaMask
- **Minter Único:** Só o `RightsMinter` pode mintar NFTs no `PlayerRightsMaster`
- **Contrato Isolado:** Um `ContractDAO` por atleta — falha em um não afeta os demais
- **Caução como Garantia:** Rescisão sem caução não pode ser executada unilateralmente

***

## Stack

| Camada | Tecnologia |
|---|---|
| Smart Contracts | Solidity ^0.8.24, OpenZeppelin v5 |
| Framework de Dev | Foundry (Forge, Cast, Anvil) |
| Padrões | ERC-721, ERC-20, EIP-712, EIP-1167 (Factory) |
| Armazenamento | IPFS |
| Rede | Sepolia Testnet |
| Frontend | Next.js + React, Vercel |
| Web3 | MetaMask, Wagmi/Viem |
| Multi-sig | Gnosis Safe |

***

## Estrutura do Repositório

```
epass/
├── src/
│   ├── RightsMinter.sol           # Gateway de autorização multi-sig
│   ├── PlayerRightsMaster.sol     # NFT master ERC-721
│   ├── ContractDAOFactory.sol     # Factory — 1 deploy por atleta
│   └── ContractDAO.sol            # Contrato por atleta (regras, caução, tokens)
├── script/
│   └── SimulatePipeline.s.sol     # Simulação end-to-end do fluxo
├── test/
│   └── (em desenvolvimento)
├── frontend/
│   └── (Next.js — em desenvolvimento)
└── README.md
```

***

## Demonstração

```bash
forge script script/SimulatePipeline.s.sol --rpc-url sepolia --broadcast
```

| Item | Link |
|---|---|
| Smart Contracts (Sepolia) | *(endereço a publicar)* |
| Aplicação | *(link Vercel — a publicar)* |
| Vídeo Demo | *(a publicar)* |

***

*ePass*