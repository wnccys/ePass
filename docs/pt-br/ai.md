# Utilização de Inteligência Artificial (IA)

Este documento descreve como a inteligência artificial foi integrada ao processo de desenvolvimento do **ePass** como uma ferramenta de co-piloto e auxílio técnico.

---

## 🛠️ Ferramentas Utilizadas

Durante a concepção, validação e codificação da plataforma, foram utilizadas as seguintes soluções de IA:
1. **Groq** (com modelos Llama-3/Mixtral para buscas ágeis de referência e consultas rápidas).
2. **Gemini** (para contextualização profunda de arquivos, análise global do ecossistema de código e estruturação de dados).
3. **Claude Code** / **Claude** (como assistente de codificação ativo e pair programming direto no terminal e editor).

---

## 🎯 Como a IA foi Utilizada

A IA foi utilizada de forma estratégica e controlada, atuando principalmente em três frentes:

### 1. Pesquisa de Possibilidades e Padrões
Antes de escrever qualquer linha de código crítico, utilizamos a IA para mapear o espaço de design e pesquisar padrões consolidados na comunidade Ethereum/EVM. Isso incluiu consultas sobre:
* Viabilidade técnica do uso de clones de proxy (**EIP-1167**) para baratear o custo de implantação de múltiplos *Escrow Vaults*.
* Estruturação e assinatura digital off-chain com segurança usando o padrão **EIP-712**.
* Melhores práticas de integração de interfaces Web3 React (Wagmi/Viem).

### 2. Validação de Ideias e Modelagem de Negócio
Utilizamos as ferramentas para debater o modelo financeiro de garantia e custódia da plataforma:
* Validação do mecanismo de distribuição de cotas (shares) e alocação do depósito de *Caution* (USDC).
* Análise da viabilidade das regras de rescisão antecipada (*penalty period* de 6 meses) sob o ponto de vista de fluxos de estados de Smart Contracts.

### 3. Implementação e Refatoração Dirigida
**A IA não substituiu a tomada de decisão do grupo.** Em vez disso, a equipe discutia detalhadamente o escopo, desenhava a arquitetura e especificava as regras de negócio desejadas. Com a especificação em mãos, solicitávamos à IA:
* Geração de templates de código e componentes de UI usando o design system do projeto.
* Tradução sistemática de páginas com internacionalização (como o fluxo de *i18n.ts*).
* Refatorações pontuais para sanar gargalos e alertas do linter de TypeScript/Next.js.

---

## 🎓 Domínio e Explicação do Grupo

> [!IMPORTANT]
> **Toda e qualquer linha de código, lógica de smart contract, decisão de arquitetura de rede ou fluxo de interface presente neste repositório foi amplamente discutida, compreendida e assimilada pelos integrantes do grupo.**
>
> Qualquer membro da equipe está plenamente capacitado a detalhar, justificar, depurar ou reescrever as partes constitutivas do projeto ePass na banca de avaliação, demonstrando completo domínio técnico sobre a solução construída.
