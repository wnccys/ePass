# Discussões Gerais do Projeto

Este documento compila as discussões de design e tarefas de planejamento arquitetônico concluídas durante nossas sessões de desenvolvimento.

## Tópicos Concluídos

* **Fluxo de Compra e Acordos**: Detalhado o fluxo criptográfico EIP-712 de assinaturas para atletas, clubes e advogados, bem como as regras de execução de Gnosis Safes.
* **Formulação de Requisitos**: Organizado a lista de requisitos funcionais (RFs) de perfis, contratos e cofres, além de requisitos não funcionais (RNFs) relacionados à proteção contra replays de assinaturas e redução de taxas de gás com o padrão clone EIP-1167.
* **Autenticação**: Definição do uso do NextAuth integrado à consulta e criação de contas via Mongoose.
* **Sincronização de Sessão Web3**: Implementado o gatilho dinâmico `update` para validar e mapear a carteira Web3 na sessão do JWT criptografado, mantendo a autenticação e guarda local em segurança.
* **Componentes e Validação**: Formulários padronizados com `@tanstack/react-form` e esquemas de validação de inputs definidos com **Zod**.
* **Integração ABI**: Uso do Wagmi-CLI para geração automatizada de hooks React fortemente tipados a partir das ABIs Solidity compiladas no Foundry.
