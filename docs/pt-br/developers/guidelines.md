# ePass: Diretrizes de Arquitetura e Regras de Desenvolvimento

Este documento descreve as decisões de arquitetura principais, padrões de codificação e fluxos de trabalho de desenvolvimento para o projeto **ePass**. Ele serve como guia de referência para desenvolvedores e agentes de IA.

---

## 1. Princípios Gerais
* **Simplicidade e Segurança**: O código deve priorizar estruturas legíveis, estados mínimos e verificação criptográfica forte em detrimento de abstrações complexas criadas sob demanda.
* **Separação de Conceitos**: Os smart contracts (`/smart-contracts`) regem as liquidações on-chain, propriedade e regras financeiras. A plataforma web (`/epass-web`) gerencia a indexação de metadados, perfis de usuários, autenticação OAuth e renderização da UI.

---

## 2. Estrutura do Projeto e Workspaces
* **Gerenciador de Pacotes**: **pnpm** (versão 11.x) é o padrão.
* **Layout de Diretórios**:
  * `/smart-contracts`: Diretório do projeto Solidity (gerenciado com Foundry).
  * `/epass-web`: Diretório do projeto frontend Next.js 16/React 19.

---

## 3. Diretrizes de Banco de Dados
* **Engine de Banco**: **MongoDB** integrado via **Mongoose**.
* **Responsabilidades do Model**:
  * Rastrear metadados off-chain (como rascunhos de contratos, atributos dos atletas e identidades de email dos usuários).
  * **Não** armazene chaves privadas, palavras-semente ou credenciais sensíveis de Web3 no banco.
  * Mapear perfis OAuth para os endereços de carteiras Web3 verificadas.

---

## 4. Bibliotecas Principais e Stack
* **UI e Estilização**: **TailwindCSS v4** (configurado via variáveis CSS/temas OKLCH em `app/globals.css`) e componentes **Shadcn UI**.
* **Internacionalização**: **i18next** (configurado para tradução completa dos painéis em inglês e português).
* **Integração Web3**: Hooks **Viem** e **Wagmi**.
* **Formulários e Validação**: **Tanstack-Form** (obrigatório para gerenciar estados de formulários) e **Zod** (para validação de schemas).

---

## 5. CI/CD e Qualidade de Código
* **Formatação de Código**: **Biome** é o formatador e linter obrigatório. As verificações do Biome são executadas no pipeline de CI com escopo restrito ao diretório `/epass-web`.
* **Verificação de Build**:
  * Smart contracts são compilados e validados no CI usando `forge build`.
  * Builds do frontend são validadas no CI usando `pnpm build` (executando sob node 20 e pnpm v11).

---

## 6. Padrões de Componentes e Formulários Frontend
* **Preferência por Shadcn UI**: Todos os elementos visuais devem priorizar primitivos do Shadcn UI sobre tags HTML puras para garantir consistência visual.
* **Lógica de Formulários**:
  * Todos os formulários interativos devem usar `@tanstack/react-form`.
  * Validações de campos devem ser declaradas utilizando schemas do **Zod**.
  * Evite gerenciar estados de input de forma manual; mapeie-os diretamente via Tanstack-Form controller.

---

## 7. Autenticação e Associação de Carteiras
* **Fronteira de OAuth**: Autenticações devem rodar via **NextAuth** utilizando o provedor Google OAuth.
* **Separação de Carteira**:
  * Os endereços de carteira não devem ser persistidos no banco de dados como credenciais de login primárias.
  * As conexões de carteira são verificadas on-chain e vinculadas dinamicamente à sessão do JWT do NextAuth.
  * Ao fazer logout, os cookies de sessão são apagados e a conexão Web3 é limpa.

---

## 8. Padrões de Desenvolvimento de Smart Contracts
* **Versão de Solidity**: `^0.8.24` compilado via **Foundry**.
* **ABI Bindings**: Interfaces de frontend são geradas usando **Wagmi-CLI** (`pnpm wagmi`) para garantir a tipagem estrita dos hooks.
* **Segurança e Código Limpo**:
  * Qualquer função de escrita e mudança de estado deve seguir estritamente o padrão **Checks-Effects-Interactions (CEI)**.
  * Funções de pagamentos e transferências externas devem herdar e aplicar guards `nonReentrant` do OpenZeppelin.
  * Deploys de cofres (vaults) devem usar a fábrica **EIP-1167 Minimal Proxy** para reduzir taxas de gás de deploy.
  * Assinaturas off-chain devem seguir a especificação de dados estruturados **EIP-712**.
