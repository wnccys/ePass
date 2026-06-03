# ePass
## Assegurando seu futuro, distribuindo seu talento!

> Documento de Apresentação de Projeto ePass — HackWeb 2026

---

## Visão Geral

O ePass é um protocolo Web3 que resolve um problema presente no início da carreira no futebol brasileiro: jovens atletas assinam contratos de direito de imagem sem transparência, sem controle e sem nenhum mecanismo de valorização.

Nós transformamos esse contrato em um registro on-chain auditável — e criamos um sistema onde qualquer pessoa pode apoiar diretamente um atleta, acreditando na carreira dele antes que o mundo perceba o seu talento.

**Confiável. Transparente. Com propósito.**

---

## O Problema

Todo ano, centenas de jovens atletas brasileiros assinam seu primeiro contrato profissional. Junto ao contrato de trabalho, assinam um **contrato de direito de imagem** — um documento que rege o uso do nome e marca do atleta pelo clube.

Esse contrato:
- É frágil e não segue padrões estruturados de registro público
- Raramente é compreendido pelo próprio atleta
- Não possui auditabilidade verificável, possibilitando maiores problemas tributários
- Não oferece nenhum instrumento de valorização de mercado para o jogador

O resultado é que um talento emergente de 17 anos, com contrato de baixo valor nominal, é completamente dependente da visibilidade que o clube decide — ou não — dar a ele. Não existe nenhuma ponte entre o potencial do atleta e o interesse do mercado antes de uma grande transferência.

---

## Nossa Solução

O ePass cria essa ponte.

Digitalizamos e registramos o contrato de direito de imagem on-chain. A partir disso, qualquer pessoa — fã, torcedor, apoiador — pode adquirir tokens `$P_IMAGE`, o **certificado de apoio** do atleta. Esse valor entra diretamente no fundo do jogador, aumentando seu valor de mercado de forma orgânica e verificável.

Não é especulação. É apoio.

---

## Como Funciona

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASSO 1 — O ACORDO                                             │
  │                                                                 │
  │  Jogador, Clube e Advogado negociam e assinam o contrato        │
  │  físico. O PDF é hasheado e enviado ao IPFS.                    │
  │  As partes assinam digitalmente via EIP-712 — sem pagar gas.    │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASSO 2 — O REGISTRO ON-CHAIN                                  │
  │                                                                 │
  │  As 3 assinaturas são validadas pelo RightsMinter.              │
  │  Um NFT master é mintado — imutável, público, auditável.        │
  │  URI do NFT aponta para os documentos no IPFS.                  │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASSO 3 — O CONTRATO DAO DO ATLETA                             │
  │                                                                 │
  │  O clube deploya um ContractDAO dedicado ao jogador,            │
  │  espelhando as regras do contrato físico:                       │
  │    · Divisão: Jogador X% · Clube Y% · Advogado Z%               │
  │    · Bonificações em $P_IMAGE                                   │
  │    · Regras de rescisão com caução                              │
  │                                                                 │
  │  O clube deposita a caução →  STATUS: PENDING → ACTIVE          │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASSO 4 — O APOIO                                              │
  │                                                                 │
  │  Tokens $P_IMAGE ficam disponíveis.                             │
  │  Apoiadores compram porque acreditam no atleta.                 │
  │  O valor entra no fundo do jogador.                             │
  │  Seu valor de mercado aumenta — registrado e verificável.       │
  │                                                                 │
  │  O atleta recebe $P_IMAGE como bonificação e converte           │
  │  para stablecoin na própria carteira, fora do sistema.          │
  └─────────────────────────────────────────────────────────────────┘
```

---

## O Token `$P_IMAGE` — Certificado de Apoio

O `$P_IMAGE` não é um ativo financeiro. Não há promessa de retorno para quem apoia.

Quem compra um token está dizendo: *"Eu acredito nesse atleta, eu apoio o futuro dele."* Esse gesto é registrado on-chain, é imutável e é público. À medida que mais pessoas apoiam, o valor acumulado no fundo do atleta cresce — e com ele, seu valor de mercado perante clubes e parceiros.

É o modelo do crowdfunding, aplicado ao futebol de base, com a segurança e transparência da blockchain.

---

## Impacto Social

| Frente | Impacto |
|---|---|
| **Transparência** | O atleta sabe exatamente o que assinou — registro público e auditável por qualquer parte |
| **Acesso a valorização** | Jogadores com contratos pequenos podem construir valor de mercado antes de uma grande transferência |
| **Segurança jurídica** | Nenhum contrato é executado sem as 3 assinaturas. A caução protege atleta e clube na rescisão |
| **Democratização do apoio** | Qualquer pessoa pode apoiar um atleta — não apenas grandes investidores ou clubes |

---

## Arquitetura Técnica

```
  OFF-CHAIN
  ─────────────────────────────────────────────────────────────────
  [PDF do Contrato]  ──hash──►  [IPFS]  ──URI──►  tokenURI do NFT
        │
        │  Assinaturas EIP-712 (sem gas)
        │  Jogador · Clube · Advogado
        ▼
  ON-CHAIN — Sepolia Testnet
  ─────────────────────────────────────────────────────────────────

             ┌──────────────────────┐
             │    RightsMinter      │  ← Gateway: valida as 3
             │  (EIP-712 Gateway)   │    assinaturas e dispara o mint
             └──────────┬───────────┘
                        │ executeMint()
                        ▼
             ┌──────────────────────┐
             │  PlayerRightsMaster  │  ← NFT ERC-721: representa
             │     (ERC-721)        │    o contrato. URI → IPFS
             └──────────┬───────────┘
                        │ Clube chama a Factory
                        ▼
             ┌──────────────────────┐
             │ ContractDAOFactory   │  ← Factory: clube paga o
             │                      │    deploy por atleta
             └──────────┬───────────┘
                        │ deploy() → 1 por atleta
                        ▼
             ┌──────────────────────────────────────┐
             │           ContractDAO                │
             │       (único por atleta)             │
             │                                      │
             │  PENDING ──► ACTIVE (caução)         │
             │                                      │
             │  Regras do contrato:                 │
             │   · Split: Jogador X%                │
             │             Clube Y%                 │
             │             Advogado Z%              │
             │   · Bonificação em $P_IMAGE          │
             │   · Rescisão com caução              │
             │                                      │
             │  Emite $P_IMAGE  ──►  Apoiadores     │
             │                                      │
             │  Jogador saca $P_IMAGE               │
             │  e converte fora do sistema          │
             └──────────────────────────────────────┘

  TRANSFERÊNCIA
  ─────────────────────────────────────────────────────────────────
  [Clube Atual] ──transferFrom()──► [Novo Clube]
  NFT transferido · Histórico preservado · Novo ContractDAO criado
```

---

## Por Que Blockchain?

A blockchain age como o **ponto central de confiança** do sistema — substituindo:

- Cartórios e registros físicos
- Auditorias contratuais por terceiros
- Intermediários financeiros no repasse ao atleta
- Fé cega nas partes envolvidas

Todo o histórico é verificável publicamente, em tempo real, por qualquer parte — via a aplicação ePass ou diretamente no Etherscan.

---

## Segurança e Proteção das Partes

- **EIP-712:** O atleta, o clube e o advogado veem exatamente o que estão assinando no MetaMask — sem ambiguidade
- **Nonces + Deadline:** Proteção contra replay attacks e transações velhas
- **Caução obrigatória:** O contrato só ativa quando o clube deposita a caução — o atleta está protegido desde o início
- **Contrato isolado por atleta:** Uma falha em um contrato não afeta nenhum outro
- **Rescisão regulada:** Não é possível rescindir unilateralmente sem seguir as regras do `ContractDAO`

---

## Stack

| Camada | Tecnologia |
|---|---|
| Smart Contracts | Solidity ^0.8.24 + OpenZeppelin v5 |
| Dev & Testes | Foundry |
| Armazenamento | IPFS |
| Rede | Sepolia Testnet |
| Frontend | Next.js + React, Vercel |
| Web3 | MetaMask + Wagmi/Viem |
| Multi-sig | Gnosis Safe |

---

## Status do Projeto

| Componente | Status |
|---|---|
| `RightsMinter.sol` | ✅ Implementado |
| `PlayerRightsMaster.sol` | ✅ Implementado |
| `ContractDAOFactory.sol` | 🔧 Em desenvolvimento |
| `ContractDAO.sol` — split, caução, rescisão | 🔧 Em desenvolvimento |
| Pipeline de simulação (Foundry) | ✅ Funcional end-to-end |
| Frontend (Next.js) | 🔧 Em desenvolvimento |
| Deploy Sepolia | 🔜 Em breve |

---

*ePass*
