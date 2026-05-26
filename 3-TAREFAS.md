# Implementação

Este documento representa aspectos técnicos e TODOs de desenvolvimento funcional e não-funcional do projeto.

> Comment Anchor: https://marketplace.visualstudio.com/items?itemName=ExodiusStudios.comment-anchors

- [] Definir Arquitetura
    - [x] Stack Back-end
        - [x] Solidity
        - [x] Foundry
        - [x] TypeScript
        - [x] OpenZeppelin
        - [x] IPFS

    - [x] Stack Front-end
        - [x] React
        - [x] Next.Js
        - [x] Tailwind (v4)
        - [x] Shadcn
        - [x] Biome (Linter)

    - [x] Definir DB
        - [x] MongoDB

    - [x] Docker
        - [x] MongoDB (Image)

    - [x] Internacionalização (Tradução) (I18n Next)
    - [] Testes (Foundry, Mocha(Chai))

- [] Tasks Funcionais

## Jogador

- [] Navbar com 3 items
    - [] Logo
    - [] Meus Contratos
    - [] Perfil
        - [] Drawer (Detalhes do contrato)
            - [] Contrato
                - [] Botão de rescindir
                - [] Id
                - [] Visualização em PDF
    - [] Tela de config
        - [] Nome
        - [] Imagem
        - [] Linkar MetaMask
            // TODO

### Home

- [] Mostra contrato ativo, e opção de assinar, na mesma página.
    * Se nenhum contrato for ativo, e mostrado um mensagem adequada.

- [] Rescisão de contrato é feita por este componente [Shadcn Drawer](https://ui.shadcn.com/docs/components/radix/drawer)

## Clube

- [] Navbar com 3 items
    - [] Logo
    - [] Meus Atletas
        - [] Listagem de atletas
            * Click (Atleta)
                - [] Perfil do Atleta (Nova Página)
                    - [] Nome
                    - [] Email
                    - [] Contrato
                        - [] Drawer
                        - [] Botão de rescindir
                        - [] Id
                        - [] Visualização em PDF

    - [] Perfil do Clube
    - [] Criar Contrato
        - [] Formulário
        - [] Upload de contrato (PDF)
            - [] Retornar hash do IPFS após upload no Backend
        - [] Valor Total da Transferência
        - [] Assinaturas necessárias
        - [] Porcentagem de Rescisão
        - [] Nome do token

### Config

- [] Tela de config
    - [] Nome
    - [] Multisig
    - []

### Home

- [] Listagem de atletas (lista)
    * Click
    - [] Perfil do Atleta (Nova Página)
        - [] Nome
        - [] Email
        - [] Contrato
            - [] Drawer
            - [] Botão de rescindir
            - [] Id
            - [] Visualização em PDF

## Compra de Token

// TODO

# Perfil de Jogador e Clube

## Jogador
* **O que é**: Representado por uma conta associada á uma carteira, um jogador é efetivamente a carteira que receberá as doações e rescisão caso aplicável.
* **O que pode fazer**:
    * **Visualizar**:
        * Clube atual
        * Seu perfil

        == Opcionais ==
        * Outros clubes
    * **Contratos**:
        - [] Visualizar
            - [] Assinar

        - [] Rescindir

## Clube
* **O que é**: Representado por uma carteira multi-sig (Gnosis Safe), que pode ver contratos com jogadores, rescindir contratos e inspecionar o mercado,
é efetivamente a carteira que receberá rescisão quando aplicável.

* **O que pode fazer**:
    * **Apresentar uma lista concisa de jogadores**:
        * Lista que pode ser ordenada por preço, qualidade e outros atributos.

    * **Apresentar perfil individual dos jogadores**:
        * Qualidades, preço, e outras preferências contratuais // TODO Á definir.

    * **Comprar jogadores**:
        * Uma requisição de compra é aberta, uma transação é proposta.
        * Essa transação será avaliada pelo jogador, família, advogados, etc...
        * List de Jogadores iniciantes ainda sem clubes.

        * **Se assinada por todos**:
            * O contrato é transformado em NFT, e liquidado em tokens que ficam disponíveis para compra.
            * O jogador pode receber uma porcentagem desses tokens, decididos via contrato.
            // TODO Definir como abonos, luvas etc... serão cobrados.

        * **Se não for concordada (tempo e assinaturas) por todos**:
            * O contrato expira e não pode ser executado.

    * **Rescindir o contrato**:
        * Uma requisição de rescisão é aberta, o contrato é quebrado e a clausula de rescisão é executada.