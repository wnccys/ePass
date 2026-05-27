# ePass ⚽

> **Tokenizando o primeiro contrato do atleta. Construindo carreiras desde o início.**

O ePass é um dApp para formalização, registro e fracionamento de direitos de imagem de jovens atletas de futebol. A solução usa blockchain para transformar um acordo jurídico assinado entre atleta, clube e advogado em um ativo digital auditável, verificável e passível de fracionamento. Por meio de smart contracts, assinaturas entre múltiplas partes e um fluxo de validação on-chain, o ePass garante transparência, segurança jurídica e um mecanismo real de valorização de mercado para jogadores em início de carreira.

Na implementação atual, o fluxo se apoia em três camadas principais: um gateway de assinaturas EIP-712, um NFT mestre que representa o direito registrado e um cofre que trava esse NFT e emite frações ERC-20. Isso permite registrar o acordo, garantir a integridade do histórico e preparar o ativo para distribuição ou futuras lógicas de mercado.

***

## O Problema

Quando um jovem atleta assina seu primeiro contrato profissional, dois documentos são produzidos: o contrato de trabalho e o contrato de direito de imagem. O segundo, na prática, costuma ter pouca padronização, baixa auditabilidade e pouca visibilidade pública. Além disso, o atleta nem sempre tem controle claro sobre o que está sendo cedido.

Outro problema é que jogadores em início de carreira geralmente possuem contratos de baixo valor nominal. Isso reduz sua capacidade de gerar interesse de mercado antes de uma grande transferência. Na prática, eles dependem quase exclusivamente da visibilidade que o clube decide — ou não — promover.

**O ePass foi criado para resolver esse problema.**

***

## A Solução

O ePass digitaliza e registra o contrato de direito de imagem on-chain, com respaldo em IPFS. A partir disso, o acordo passa a ter rastreabilidade pública e pode ser validado de forma criptográfica pelas partes envolvidas.

Com o contrato registrado, qualquer interessado pode apoiar diretamente o atleta por meio dos tokens `$P_IMAGE`, que funcionam como certificados digitais vinculados ao contrato. Esse apoio reforça a valorização do jogador e fortalece seu posicionamento de mercado. A lógica do projeto não é especulativa: o foco está em criar uma estrutura de incentivo, visibilidade e valorização para talentos em formação.

***

## Arquitetura de Smart Contracts

O protocolo é composto por três contratos principais, implantados na **Sepolia Testnet**.

### Fluxo off-chain


[Contrato PDF] ──hash──► [IPFS] ──URI──► tokenURI do NFT

       │
       │ Jogador, Clube e Advogado
       │ assinam digitalmente (EIP-712, sem gas)
       ▼



### Fluxo on-chain


+-------------------+        1. Definição do acordo        +-------------------+
|      Jogador      | -----------------------------------> |                   |
+-------------------+                                      |                   |
                                                           |                   |
+-------------------+        2. Definição do acordo        |                   |
|       Clube       | -----------------------------------> | Documento legal   |
+-------------------+                                      |   off-chain       |
                                                           | (contrato + URI)  |
+-------------------+        3. Definição do acordo        |                   |
|     Advogado      | -----------------------------------> |                   |
+-------------------+                                      +---------+---------+
                                                                     |
                                                                     | 4. Geração da tokenURI
                                                                     |    (IPFS / metadata)
                                                                     v
                                                           +-------------------+
                                                           |   Frontend / App   |
                                                           | monta MintAgreement|
                                                           +---------+---------+
                                                                     |
                                                                     | 5. Assinaturas EIP-712
                                                                     |    player + club + attorney
                                                                     v
                                                           +-------------------+
                                                           |   RightsMinter    |
                                                           | executeMint()      |
                                                           +---------+---------+
                                                                     |
                          6. Verifica deadline ---------------------->|
                          7. Verifica nonce ------------------------->|
                          8. Recupera e valida 3 assinaturas ------->|
                                                                     |
                                                                     | 9. mintRights(req.club, tokenURI)
                                                                     v
                                                           +-------------------+
                                                           | PlayerRightsMaster |
                                                           |    ERC-721 NFT     |
                                                           +---------+---------+
                                                                     |
                                                                     | 10. NFT mestre mintado
                                                                     |     para o clube
                                                                     v
+-------------------+      11. approve(tokenId)            +-------------------+
|       Clube       | -----------------------------------> |    RightsVault    |
+-------------------+                                      | fractionalize()    |
                                                           +---------+---------+
                                                                     |
                          12. Confere ownerOf(tokenId) ------------->|
                          13. Transfere NFT para o cofre ----------->|
                          14. Marca NFT como locked ---------------->|
                          15. Minta ERC-20 fracionário ------------->|
                                                                     v
                                                           +-------------------+
                                                           | Tokens P_IMAGE     |
                                                           | enviados ao clube  |
                                                           +-------------------+



***

## Papel de Cada Contrato

### PlayerRightsMaster

Contrato ERC-721 responsável por representar o direito principal registrado no sistema. Cada token corresponde a um acordo validado e carrega uma `tokenURI` com a referência do documento ou metadado jurídico vinculado ao ativo. Apenas o endereço configurado como `authorizedMinter` pode emitir novos tokens.

### RightsMinter

Contrato gateway que centraliza a autorização criptográfica do acordo. Ele implementa EIP-712 para assinar e verificar uma estrutura `MintAgreement`, contendo jogador, clube, advogado, URI do documento, nonce e deadline. Depois de validar tudo, dispara o mint do NFT mestre para o clube e emite o evento `AgreementAuthorized`.

### RightsVault

Contrato ERC-20 que funciona como cofre de fracionamento. Após receber aprovação do clube para movimentar o NFT mestre, o contrato trava esse NFT dentro do vault e emite os tokens fungíveis que representam as frações econômicas ou operacionais daquele direito tokenizado.

***

## Status do Contrato

| Status | Descrição |
| :-- | :-- |
| `PENDING` | Contrato preparado e aguardando validação final. |
| `ACTIVE` | Acordo validado e ativo on-chain. |
| `RESCINDED` | Acordo encerrado conforme as regras definidas. |
| `EXPIRED` | Acordo expirado por término de vigência. |


***

## Como a Solução Funciona

O contrato jurídico é negociado e fechado entre jogador, clube e advogado, com referência ao documento armazenado off-chain e apontado por uma `tokenURI`, idealmente em IPFS.

Em seguida, o frontend monta uma estrutura `MintAgreement` com os endereços das três partes, a `tokenURI`, o nonce e o prazo limite.

Cada parte assina esse acordo no padrão EIP-712. O `RightsMinter` valida prazo, nonce e autenticidade individual de cada assinatura.

Se todas as validações forem aprovadas, o `RightsMinter` chama o `PlayerRightsMaster`, que emite o NFT mestre com a URI do documento e entrega esse NFT ao clube.

Depois disso, o clube pode aprovar o `RightsVault` e chamar `fractionalize()`. O cofre confere a titularidade do NFT, transfere o ativo para si e emite tokens ERC-20 fracionários correspondentes ao direito tokenizado.

***

## Segurança

- Apenas o minter autorizado pode criar novos NFTs no `PlayerRightsMaster`.
- O `RightsMinter` rejeita acordos expirados.
- O `RightsMinter` usa nonce por jogador para evitar replay de assinatura.
- O `RightsMinter` exige que cada assinatura corresponda exatamente ao endereço esperado no acordo.
- O `RightsVault` só aceita fracionamento se quem chamou a função for o dono atual do NFT.
- O `RightsVault` só pode ser inicializado uma vez para aquele ativo travado.

***

## Stack

| Camada | Tecnologia |
| :-- | :-- |
| Smart Contracts | Solidity ^0.8.24, OpenZeppelin v5 |
| Framework de Dev | Foundry (Forge, Cast, Anvil) |
| Padrões | ERC-721, ERC-20, EIP-712 |
| Armazenamento | IPFS |
| Rede | Sepolia Testnet |
| Frontend | Next.js + React |
| Web3 | MetaMask, Wagmi/Viem |
| Multi-sig | Gnosis Safe |


***

## Estrutura do Repositório


epass/
├── src/
│   ├── RightsMinter.sol        # Gateway de autorização multi-parte
│   ├── PlayerRightsMaster.sol   # NFT mestre ERC-721
│   └── RightsVault.sol          # Cofre de fracionamento
├── script/
│   └── SimulatePipeline.s.sol   # Simulação end-to-end do fluxo
├── test/
│   └── (em desenvolvimento)
├── epass-web/
│   └── (Next.js — em desenvolvimento)
└── README.md



***

## Demonstração

bash:
forge script script/SimulatePipeline.s.sol --rpc-url sepolia --broadcast


| Item | Link |
| :-- | :-- |
| Smart Contracts (Sepolia) | *(endereço a publicar)* |
| Aplicação | *(link a publicar)* |
| Vídeo Demo | *(a publicar)* |


***

## Ajuste Conceitual Importante

Hoje, pelo código atual, o projeto **não implementa ainda**:

- repasse automático de doações para o jogador;
- divisão programática entre jogador, advogado e clube;
- compra e venda primária dentro do próprio vault;
- transferência automática de contrato entre clubes com liquidação completa da operação.

Essas ideias podem entrar como evolução futura do protocolo, mas não fazem parte da base atual dos contratos.

***

## Próximos Passos

Como evolução da arquitetura atual, o projeto prevê incorporar regras de distribuição automática de receitas, repasse direto ao atleta, lógica de arrecadação via compra primária de frações e mecanismos de transferência de posição entre clubes em novas negociações. A base jurídica e técnica para isso já começa com o registro verificável do acordo, a emissão do NFT mestre e seu fracionamento on-chain.

***

Se você quiser, no próximo passo eu posso transformar isso em uma **versão mais formal de README de GitHub**, com linguagem mais limpa, títulos mais consistentes e pronto para colar no repositório.

