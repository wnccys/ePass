# Guia de Início do Desenvolvedor e Cronograma de Implementação

Este documento serve como o portal do desenvolvedor para o projeto **ePass**. Ele detalha nossa stack de tecnologia principal, configuração de projeto, banco de dados, ambientes locais de desenvolvimento e fluxos de trabalho de implementação.

---

## 1. Stack de Tecnologia Principal

O monorepo do ePass depende de:
* **Node.js `v22.22.2`**
* **pnpm `v11.5.1`**

O monorepo do ePass é dividido em dois diretórios principais:

### Backend e Smart Contracts (`/smart-contracts`)
* **Solidity `^0.8.24`**: Smart contracts principais.
* **Foundry**: Compilação, testes unitários e scripts de deploy.
* **OpenZeppelin**: Padrões seguros (ERC-20, ERC-721, EIP-712).
* **IPFS (Pinata SDK)**: Armazenamento de documentos jurídicos.

### Aplicação Frontend (`/epass-web`)
* **React 19 & Next.js 16 (App Router)**: Componentes cliente e servidor.
* **Tailwind CSS v4 & PostCSS**: Tema e variáveis/tokens OKLCH personalizados.
* **Shadcn UI**: Presets de design e componentes primitivos.
* **Wagmi & Viem**: Hooks de integração Web3 e RPC node wrappers.
* **Biome**: Linter e formatador automático de código.

---

## 2. Configuração do Ambiente de Desenvolvimento Local

Para simular toda a arquitetura híbrida localmente, execute os seguintes componentes:

### 1. Banco de Dados (MongoDB)
Inicie uma instância local do MongoDB e o gerenciador web Compooss usando Docker:
```bash
docker compose -f src/docker-compose.yml up -d
```
* **MongoDB**: Executa na porta `27017`.
* **Compooss (Visualizador Web)**: Acessível em `http://localhost:6969`.

### 2. Node de Blockchain Local (Anvil)
Execute um simulador local de rede EVM para realizar deploys e interações com smart contracts:
```bash
anvil
```

### 3. Explorador de Blocos Local
Inspecione transações e contratos localmente usando o explorador customizado:
* Vá para o diretório `/explorer`, instale as dependências usando **yarn** e inicie com o comando **dev**:
  ```bash
  cd explorer
  yarn install
  yarn dev
  ```

---

## 3. ABI Bindings e wagmi-cli
Nós geramos hooks React tipados diretamente a partir das ABIs de Solidity.
1. Certifique-se de que o anvil local esteja rodando e os contratos compilados.
2. Execute a ferramenta de geração de código:
   ```bash
   pnpm wagmi
   ```
Isso atualizará os arquivos gerados em `src/epass-web` para sincronizar os hooks React com quaisquer mudanças feitas no código Solidity.

---

## 4. Internacionalização (i18n)
As traduções são gerenciadas via `i18next` dentro do diretório `src/epass-web`. 
* Os arquivos são localizados para inglês (`en`) e português (`ptBr`).
* Traduz botões Web3, inputs de onboarding, modais de conexão SIWE e indicadores de métricas.
