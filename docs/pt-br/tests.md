# Guia de Testes Automatizados

O ePass conta com uma suite de testes robusta e automatizada para garantir a confiabilidade de todas as regras de negócio on-chain (smart contracts) e off-chain (frontend e integrações). O pipeline de testes é dividido em três camadas principais: unitários on-chain, unitários/integração do cliente e testes de comportamento ponta a ponta (E2E/BDD).

---

## ⛓️ 1. Testes de Smart Contracts (Foundry)

Os testes on-chain são desenvolvidos utilizando **Foundry (Forge)**, permitindo asserções em Solidity com alta performance e simulações realistas da EVM.

### Estrutura do Teste (`src/smart-contracts/test/`)

#### A. `PlayerRightsMaster.t.sol` (NFT Mestre)
Focado em testar o ciclo de vida do token ERC-721 representativo dos direitos.
* **Minter Autorizado**: Garante que apenas o gateway `RightsMinter` tem permissão de cunhar novos NFTs. Tentativas de mint por contas comuns devem falhar com `CallerNotAuthorized()`.
* **Bloqueio de Transferências Livres**: Valida a regra de "soulbound" em que transferências diretas via `transferFrom` ou `safeTransferFrom` são bloqueadas, a menos que o remetente seja um operador autorizado explicitamente (`authorizedOperators`).

#### B. `RightsMinter.t.sol` (Gateway EIP-712)
Verifica o sistema de criptografia off-chain e autorizações multifirmadas.
* **Validação de Assinatura Tripla**: Utiliza chaves privadas locais para gerar assinaturas digitais válidas para o jogador, clube e advogado. O teste valida que o `RightsMinter` recupera com sucesso os endereços usando `ecrecover` e autoriza o mint.
* **Proteção contra Expiração (Deadline)**: Simula uma transação enviada após o `deadline` especificado no acordo, garantindo que o contrato reverta com `SignatureExpired()`.
* **Proteção contra Replay de Assinaturas**: Executa o mesmo acordo duas vezes e valida que a segunda chamada falha com `AgreementAlreadyExecuted()`.

#### C. `RightsVault.t.sol` (Cofre & Escrow)
Testa toda a lógica financeira de depósitos, prazos, frações de tokens e penalidades.
* **Fracionamento de Ativos**: Valida a cunhagem do ERC-20 utilitário `$P_IMAGE` e sua distribuição exata baseada em basis points configurados (`playerShares`, `clubShares` e `attorneyShares`).
* **Regras de Rescisão e Escrow**:
  * **Antes de 6 meses**: Simula uma rescisão prematura. Valida matematicamente que o valor de caução depositado é distribuído na proporção exata de 65% para a parte penalizada e 35% para a parte desistente.
  * **Após de 6 meses**: Simula rescisão após o semestre. Garante que 100% da caução retorna ao clube.
* **Expiração de Contrato**: Simula o avanço no tempo do bloco (`vm.warp`) em 365 dias + 1 dia de buffer para testar a chamada `expireContract()`, garantindo o retorno total da caução.
* **Proteção contra Reentrância**: Simula vetores de ataque em retiradas financeiras e valida que o modificador `nonReentrant` barra recursividade maliciosa.

**Comando para Execução:**
```bash
cd src/smart-contracts
forge test -vv
```

---

## 🖥️ 2. Testes de Frontend (Vitest)

O frontend utiliza **Vitest** para validação ágil de utilitários, hooks React e lógica de formatação.

### Estrutura do Teste (`src/epass-web/__tests__/`)

* **`validations.test.ts` (Validações de Formulário)**:
  * Garante que os campos de cadastro do acordo jurídico exigem endereços Ethereum válidos.
  * Valida que a soma das frações (basis points) entre jogador, clube e advogado totalize exatamente `10.000` (100%).
* **`utils.test.ts` (Utilitários Globais)**:
  * Testa funções de tratamento de strings, formatação de hashes de transações e manipulações matemáticas de `BigInt` (conversão de wei para decimal do USDC).
* **`web3/eip712.test.ts` (Payload Criptográfico)**:
  * Valida que a estrutura JSON do domínio e dos tipos do `MintAgreement` gerada no cliente é perfeitamente compatível com a exigida na especificação EIP-712 on-chain.
* **`web3/contracts.test.ts` (Leitura/Escrita de Contratos)**:
  * Mocka as conexões RPC e testa a resposta dos hooks do Wagmi e Viem simulando estados de carregamento, sucesso e falhas de rede.

**Comando para Execução:**
```bash
cd src/epass-web
pnpm run test
```

---

## 🎭 3. Testes End-to-End & BDD (Playwright)

Para testes funcionais reais, o ePass utiliza **Playwright** combinado com **playwright-bdd** (sintaxe Gherkin/Cucumber), simulando a experiência exata do usuário no navegador.

### Cenários de Comportamento (`src/epass-web/e2e/features/`)

#### A. Autenticação (`auth.feature`)
```gherkin
Feature: Autenticação de Usuário
  Scenario: Login com sucesso via carteira Web3 (SIWE)
    Given que o usuário está na página inicial
    When ele clica em "Conectar Carteira"
    And assina a mensagem criptográfica de login (SIWE)
    Then a sessão deve ser criada e o painel administrativo deve ficar visível
```

#### B. Navegação (`navigation.feature`)
* Valida a segurança de rotas protegidas por NextAuth, garantindo que usuários não logados sejam redirecionados para a tela de login ao tentar acessar painéis confidenciais de atletas ou clubes.

#### C. Fluxo de Acordo (`new-contract.feature`)
* Simula o fluxo de ponta a ponta: preenchimento do formulário de contrato, upload do documento em PDF, disparo da modal de assinatura tripla (simulando a confirmação das assinaturas via provedor Web3 mockado), envio da transação ao `RightsMinter` e persistência dos dados no banco MongoDB.

**Comando para Execução:**
```bash
cd src/epass-web
pnpm run test:e2e
```
