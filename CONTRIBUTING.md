# 🤝 Contributing to ePass / Contribuindo com o ePass

Thank you for your interest in contributing to ePass! This project is open-source, and we welcome contributions in the form of bug reports, feature requests, documentation improvements, and code changes.

Obrigado pelo seu interesse em contribuir com o ePass! Este projeto é de código aberto, e aceitamos contribuições na forma de relatórios de bugs, solicitações de recursos, melhorias na documentação e alterações de código.

---

## 🌐 Language Selector / Seleção de Idioma

- [English Guidelines](#english-contribution-guidelines)
- [Diretrizes em Português](#diretrizes-de-contribuicao-em-portugues)

---

## English Contribution Guidelines

Welcome! To make the contribution process smooth, please follow these guidelines.

### 🐛 1. Reporting Bugs
- Use the GitHub Issues tracker.
- Describe the bug clearly: what happened, what was expected, and steps to reproduce.
- Include environment details (OS, node/npm version, browser/wallet if applicable).

### 💡 2. Suggesting Features
- Open a GitHub Issue and explain the feature, why it is useful, and how it might be implemented.

### 🛠️ 3. Code Contributions (Pull Requests)
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Make your changes.
3. Ensure your code compiles and passes all checks:
   - For **Smart Contracts**: Run `forge test -vv` in `src/smart-contracts`.
   - For **Frontend**: Run `pnpm run test` and `pnpm run test:e2e` in `src/epass-web`.
   - *Note: Other available commands (such as `build`, `dev`, `lint`) can be found in the [package.json](file:///home/wnccys/Progs/ETH/ePass/src/epass-web/package.json) of the web project.*
4. Commit your changes using clear commit messages (preferably following [Conventional Commits](https://www.conventionalcommits.org/)).
5. Push to your branch and open a Pull Request (PR).

---

## Diretrizes de Contribuição em Português

Bem-vindo! Para facilitar o processo de contribuição, por favor siga estas instruções.

### 🐛 1. Reportando Bugs
- Utilize a aba de Issues do GitHub.
- Descreva o bug com clareza: o que aconteceu, o comportamento esperado e os passos para reproduzir.
- Inclua detalhes do ambiente (SO, versão do node/npm, navegador/carteira se aplicável).

### 💡 2. Sugerindo Recursos (Features)
- Abra uma Issue no GitHub explicando o recurso, sua utilidade e como ele poderia ser implementado.

### 🛠️ 3. Contribuições de Código (Pull Requests)
1. Faça um Fork do repositório e crie uma branch a partir de `main`:
   ```bash
   git checkout -b feature/minha-nova-funcionalidade
   ```
2. Realize suas alterações de código.
3. Garanta que o código compila e passa em todos os testes:
   - Para os **Smart Contracts**: Execute `forge test -vv` em `src/smart-contracts`.
   - Para o **Frontend**: Execute `pnpm run test` e `pnpm run test:e2e` em `src/epass-web`.
   - *Nota: Outros comandos disponíveis (como `build`, `dev`, `lint`) podem ser encontrados no arquivo [package.json](file:///home/wnccys/Progs/ETH/ePass/src/epass-web/package.json) do projeto web.*
4. Faça o commit utilizando mensagens claras (de preferência seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/)).
5. Envie as alterações para o seu fork e abra um Pull Request (PR) direcionado à branch principal.
