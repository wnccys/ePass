# Study

Este arquivo explica como o projeto funciona nesta branch de estudo específica.

// DAI -> Study
// ERC-1155
// ERC-6909
// README - autores

Alguns clubes de menor porte na Europa e na América Latina começaram a usar plataformas DeFi (Finanças Descentralizadas) para dar como garantia os contratos de venda de seus jogadores

```
[Contrato de Venda Tradicional (PDF)]
       │
       ▼ (Tokenização em plataforma RWA)
[Smart Contract na Blockchain] ──> Garante o colateral (Recebível futuro)
       │
       ▼ (Execução automatizada)
[Pool de Liquidez DeFi] ──> Libera capital imediato para o clube em Stablecoins
```

Se o clube comprador atrasar a parcela, o smart contract pode executar travas automáticas ou redirecionar outras receitas tokenizadas do clube devedor diretamente para os investidores da pool.

Por que os Smart Contracts ainda não dominam as transferências?
A barreira não é tecnológica, é regulatória.

Para que a venda do Endrick ocorresse em um contrato inteligente, o Real Madrid e o Palmeiras precisariam de wallets institucionais, e o Banco Central do Brasil precisaria aceitar uma transação em blockchain (como o DREX, que está em desenvolvimento) para validar a entrada de divisas estrangeiras. Além disso, as regras de conformidade ("Know Your Customer" ou KYC) impostas pela FIFA para evitar que o futebol seja usado para lavagem de dinheiro hoje rodam dentro do ecossistema fechado do FIFA TMS, que é totalmente Web2.

## Rights Minter

Funciona criando a estrutura `MintAgreement`, que pode (e deve) ser assinada por várias pessoas definidas.
A função principal aqui é a `executeMint()`, que verifica as assinaturas e chama `mintRights(club, URI)`, o que efetivamente registra o NFT para o clube.

* **`constant MINT_AGREEMENT_TYPEHASH`** => Define o formato da transação que o contrato receberá (esta transação é multiassinada).
    * Basicamente, define a estrutura exata de um pacote de dados que um usuário assinará off-chain com sua carteira (como a MetaMask).
    * O `keccak256` é usado para criar um hash, que será utilizado posteriormente para verificar se:
        * O usuário realmente assinou essa parte específica de dados.
        * Ninguém modificou os dados (como alterar o endereço do jogador ou o prazo final) após a assinatura.

* **`_hashTypedDataV4`**: Esta função da OpenZeppelin lida automaticamente com o EIP-712 Domain Separator. Ela garante que uma assinatura destinada a este contrato na Ethereum Mainnet não possa ser reutilizada em um contrato idêntico implantado na Arbitrum ou em uma rede de testes (testnet).

* **`abi.encode(...)`**: A função `abi.encode` pega todas as partes separadas de dados e as comprime em um fluxo contínuo de bytes. Para fazer isso corretamente de acordo com o padrão EIP-712, ela segue uma ordem rigorosa:
    * **Primeiro**: Passa o `MINT_AGREEMENT_TYPEHASH`. Isso diz ao algoritmo criptográfico: *"Ei, os dados a seguir correspondem exatamente ao modelo que definimos anteriormente."*
    * **Em seguida**: Passa os valores reais do jogador (`player`), clube (`club`), advogado (`attorney`), `nonce` e prazo final (`deadline`) na ordem exata em que foram declarados no modelo.

* **Nonces**: Ao herdar `Nonces` e usar `_useCheckedNonce(req.player, req.nonce)`, garantimos que um acordo específico só possa ser executado exatamente uma vez. O estado do nonce está atrelado ao endereço do jogador.

### `_getDomainSeparator([...])` & `_getDigest([...])`

O Domain Separator é um padrão para evitar ataques de replay em contratos ERC-712. Ele age como uma garantia de que a transação só pode ser executada em um contrato específico escolhido. Dessa forma, as assinaturas não podem ser manipuladas maliciosamente.

Digest são os dados finais compactados // TODO

## Player Rights Minter

O contrato que efetivamente delega o NFT ao clube após o contrato ter sido assinado corretamente por todas as partes exigidas (após a verificação das assinaturas).

## Token Factory

### 1. Você deve usar uma Token Factory?
Sim, absolutamente. Se você combinar o contrato de uma superestrela com o de um jogador novato em um único pool de liquidez, você destrói o mercado. Os investidores querem especular sobre ativos específicos.

Para escalar isso, você precisa de um smart contract de Vault Factory (ou Token Factory).

**Como funciona:** Em vez de codificar rigidamente um único vault, você escreve um `VaultFactory.sol`. Toda vez que um novo Master NFT é cunhado, o Clube chama `VaultFactory.deployVault(tokenId)`.

**O resultado:** A factory gera automaticamente um smart contract ERC-20 novinho em folha e isolado apenas para aquele jogador (por exemplo, `$P_NEYMAR` com seu próprio suprimento e preço) e bloqueia o NFT dentro dele.

> **Dica de mestre:** Use o padrão EIP-1167 (*Minimal Proxy Pattern*) para sua factory. Implantar um contrato ERC-20 totalmente novo para cada jogador custa muito gás. A Proxy Factory implanta "clones" leves que apontam para um único contrato lógico mestre, reduzindo seus custos de implantação em cerca de 90%.

### 3. Assinaturas Brutas vs. Multisig: Qual delas você deve usar?
Você não escolhe entre elas — você usa ambas, mas para pessoas diferentes.

As entidades do mundo real no seu sistema têm necessidades de segurança diferentes. Um jogador de futebol é uma pessoa física; a SPV do Clube é uma entidade corporativa.

Aqui está como você estrutura a arquitetura:

* **O Jogador & Advogado (Pessoas Físicas):** Usam Assinaturas EIP-712 Brutas (*Raw Signatures*).
O jogador está sentado no sofá usando um iPhone. Ele só quer abrir um aplicativo, ler os termos e clicar em "Assinar". O fluxo EIP-712 que discutimos anteriormente é perfeito para isso. Não custa gás e comprova o consentimento dele.
* **A SPV do Clube (Corporação):** Usa uma Multisig (Safe).
A SPV é a entidade que realmente executa a transação on-chain e guarda o Master NFT. Ela não pode ser controlada por uma única chave privada.

### O Fluxo de Trabalho Escalável Completo
Aqui está exatamente como as assinaturas brutas e a multisig funcionam juntas para cunhar e fracionar um contrato:

1. **Pessoas Físicas Assinam (Off-Chain):** Assinaturas EIP-712.
    * O Jogador e o Advogado revisam o contrato no seu frontend.
    * Cada um assina o digest EIP-712 usando a MetaMask ou WalletConnect.
    * Essas assinaturas brutas são salvas no seu banco de dados do backend.
2. **A SPV Propõe a Transação:** Dentro da Safe.
    * Um dos membros do conselho da SPV faz login no painel da Gnosis Safe.
    * Ele propõe uma transação para chamar `mintAgreement()` no seu smart contract, anexando as assinaturas brutas do Jogador e do Advogado como payload de dados.
3. **O Conselho da SPV Aprova:** Consenso da Multisig.
    * Os outros membros do conselho da SPV revisam a transação proposta.
    * 3 de 5 deles devem assinar a transação dentro da Gnosis Safe para aprová-la.
4. **Execução & Cunhagem (Mint):** Liquidação On-Chain.
    * Assim que o limite mínimo (*threshold*) é atingido, a Safe envia a transação para a blockchain, pagando o gás.
    * O smart contract usa `ecrecover` para verificar as assinaturas brutas anexadas vindas do Passo 1.
    * Se forem válidas, o NFT é cunhado diretamente no vault da Safe.

---

# Fluxo de Securitização de RWA: Direitos de Imagem de Jogador de Futebol

Este documento descreve a análise arquitetônica, os padrões ERC ideais e o fluxo de execução passo a passo para a tokenização dos direitos de imagem e recebíveis futuros de um jogador de futebol. Ao tokenizar esses direitos, um título (*bond*) on-chain é emitido, lastreado pelo fluxo de caixa futuro de acordos de marcas e patrocínios.

## 1. Padrões ERC: Opções & Trade-offs

A escolha do padrão de token correto dita como os protocolos DeFi podem interagir com o ativo.

| Padrão | Arquitetura | Prós | Contras |
| :--- | :--- | :--- | :--- |
| **ERC-721 (NFT)** | Um token representa o contrato legal exato (1:1). | Mapeia perfeitamente um PDF legal exclusivo. Fácil de implementar metadados apontando para o IPFS. | **Iliquidível.** Você não pode pegar valor *parcial* emprestado na maioria dos protocolos de empréstimo DeFi; é tudo ou nada. |
| **ERC-1155 (Multi-Token)** | Um ID de token representa o jogador, com um suprimento que representa "cotas" do contrato. | Permite propriedade fracionada nativamente. Os investidores podem comprar 10% dos direitos de imagem do jogador. | Menor suporte em mercados de empréstimo DeFi legados em comparação com ERC-20 puros. |
| **ERC-3525 (Semi-Fungível)** | Os tokens têm IDs exclusivos (como o 721), mas contêm um campo quantitativo de `value` (como o 20). | **Ideal para títulos financeiros/recebíveis.** Você pode dividir, fundir e transferir *valores* dos direitos de imagem entre carteiras. | Exige adaptadores personalizados para DEXs e pools de empréstimo padrão. |
| **Fracionado (ERC-721 → ERC-20)** | O ERC-721 fica bloqueado em um vault, que emite tokens ERC-20 representando as frações. | **Liquidez máxima.** Os ERC-20 se conectam facilmente a pools de empréstimo no estilo Uniswap ou Aave. | Alta complexidade arquitetônica. Risco regulatório extremo (funciona exatamente como um valor mobiliário não registrado). |

**Recomendação para uma PoC de Fintech:** Use a **abordagem fracionada (ERC-721 bloqueado em um vault ERC-20)** ou o **ERC-1155**. Eles oferecem a integração mais fácil com os pools de liquidez existentes para liberar capital imediato.

---

## 2. O Fluxo de Execução de Ponta a Ponta

A securitização de um RWA exige um processo rigoroso e ordenado, no qual a falha em uma etapa invalida o ativo. Aqui está como o fluxo opera após os termos legais serem acordados:

### Passo 1: O Invólucro Legal (SPV)
Uma Sociedade de Propósito Específico (SPV) deve ser criada off-chain. O jogador cede os direitos para a SPV. O smart contract não é dono do jogador; o smart contract é dono da SPV, que por sua vez detém os direitos legais.

### Passo 2: Autorização Multi-Sig (ERC-712 & Safe)
A transação para cunhar o ativo tokenizado é colocada na fila. Como várias partes precisam concordar, você utiliza uma conta inteligente **Safe (antiga Gnosis Safe)**. O Jogador, o Advogado e o Clube fornecem assinaturas estruturadas off-chain usando o **ERC-712** para verificar sua intenção. Assim que todas as assinaturas são coletadas, a transação é executada on-chain.

### Passo 3: Cunhagem (Mint) do Ativo
O Smart Contract verifica as assinaturas ERC-712. Se forem válidas, ele cunha um ERC-721 que representa o contrato mestre. Esse NFT é depositado imediatamente em um **Vault Contract** (Contrato de Cofre).

### Passo 4: Fracionamento & Colaterização
O Vault Contract cunha tokens ERC-20 (por exemplo, `$P_IMAGE`) representando cotas fracionárias dos recebíveis futuros. O Clube pega esses tokens ERC-20 e os deposita em um Pool de Empréstimo DeFi (como um fork personalizado da Aave).

### Passo 5: Liberação de Liquidez
O pool de empréstimo aceita o `$P_IMAGE` como colateral e libera stablecoins (USDC) para o Clube, fornecendo capital imediato.

### Passo 6: Pagamento de Rendimentos (Yield)
À medida que o jogador gera receita no mundo real (contratos com a Nike, comerciais de TV), o dinheiro fiduciário (*fiat*) é pago à SPV, convertido em USDC e enviado de volta ao Vault Contract. O Vault distribui esse rendimento proporcionalmente para quem quer que possua os tokens `$P_IMAGE` (ou o utiliza para amortizar o empréstimo de stablecoin do Clube).

---

## 3. Rastreando o Valor do Jogador na Ethereum

O rastreamento de valor em RWAs opera em dois vetores distintos: **Valor Especulativo** e **Valor de Rendimento (Yield)**.

### Valor Especulativo (Preço do AMM)
Se você criar um pool de liquidez ERC-20 (`$P_IMAGE` / `USDC`) em uma corretora descentralizada (DEX) como a Uniswap, o livre mercado ditará o valor.
* Se o jogador marcar um hat-trick em uma final, a demanda pelo seu token aumenta e o preço do AMM sobe.
* Para rastrear isso de forma segura on-chain para que seu pool de empréstimo calcule os limites de liquidação, você usaria um oráculo **TWAP (Preço Médio Ponderado Pelo Tempo)** diretamente do pool da Uniswap V3.

### Valor de Rendimento & Oráculos de Desempenho
Você pode vincular o desempenho do jogador no mundo real diretamente às mecânicas financeiras do contrato usando uma arquitetura personalizada de Oráculo EVM. Em vez de apenas rastrear gols, o nó do Oráculo busca dados de APIs esportivas e métricas de redes sociais para atualizar o estado on-chain:

* **Taxas de Juros Dinâmicas:** O smart contract pode ser programado para que, se o Oráculo relatar que o jogador atingiu 10 milhões de seguidores no Instagram, a taxa de juros que o Clube paga em seu empréstimo DeFi diminua (porque o colateral agora é considerado "mais seguro" ou mais valioso).
* **Dividendos por Desempenho:** Se o jogador atingir marcos específicos (por exemplo, ganhar a Bola de Ouro), o Oráculo aciona o pagamento de um bônus pré-programado da tesouraria do Clube para os detentores dos tokens.