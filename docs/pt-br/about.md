# Sobre o ePass: Recebíveis de Futebol On-Chain e RWA

O ePass é um mercado on-chain descentralizado para tokenização de direitos de jogadores de futebol, recebíveis futuros de transferências e direitos de imagem. Ele resolve o problema de fluxo de caixa dos clubes de futebol tokenizando recebíveis futuros e direitos de mecanismos de solidariedade, liberando liquidez imediata.

---

## 1. Visão Geral do Domínio e o Problema Financeiro Central

Os clubes de futebol, especialmente em mercados em desenvolvimento (como a América Latina e ligas europeias de menor porte), frequentemente sofrem com desequilíbrios graves de fluxo de caixa. Embora as transferências de jogadores gerem avaliações altas, os compradores raramente pagam o valor total à vista. Em vez disso, as taxas de transferência são estruturadas em parcelas pagas ao longo de 6 a 24 meses.

Enquanto isso, os clubes têm despesas operacionais imediatas e de curto prazo:
* Obrigações salariais mensais para atletas e comissões técnicas.
* Manutenção de infraestrutura e financiamento das categorias de base.
* Dívidas e obrigações fiscais que exigem liquidez imediata.

### A Solução ePass (Tokenização de RWA)
O ePass preenche essa lacuna tokenizando recebíveis futuros de transferência e direitos de mecanismo de solidariedade on-chain:
```
[Contrato Físico de Transferência / Direito de Solidariedade]
                             │
                             ▼ (Wrapper Legal e Upload no IPFS)
             [Consentimento Multi-Party EIP-712]
                             │
                             ▼ (Cunhagem On-Chain)
               [NFT Master de Acordo ERC-721]
                             │
                             ▼ (Deploy de Clone via TokenFactory)
               [Cotas Fracionadas ERC-20 ($P_IMAGE)]
                             │
                             ▼ (Garantia em Pool de Empréstimo DeFi)
      [Liberação Imediata de Liquidez em Stablecoins (USDC)]
```
Ao colateralizar o contrato on-chain, os clubes obtêm capital imediato em stablecoins (USDC) a partir de pools de liquidez descentralizados, que são posteriormente reembolsados à medida que as parcelas fiat da transferência real fluem para a SPV (Sociedade de Propósito Específico).

---

## 2. Órgãos Reguladores e Sistemas de Transferência Tradicionais

Uma das principais barreiras para a automação on-chain completa é a integração com os marcos regulatórios esportivos tradicionais. O ePass coordena-se com essas entidades off-chain por meio de wrappers jurídicos:

### FIFA TMS (Transfer Matching System)
* **O que é**: Um sistema Web2 fechado e centralizado operado pela FIFA para registrar transferências internacionais. Tanto o clube comprador quanto o vendedor devem fazer o upload de contratos idênticos (PDFs) e combinar os detalhes da transação (valores, contas bancárias, mecanismos de solidariedade, parcelas).
* **A Restrição**: Divergências de até €50.000 travam o processo de correspondência, bloqueando o Certificado de Transferência Internacional (ITC) do jogador. O ePass replica esses parâmetros em seu construtor de smart contracts para alinhar-se perfeitamente com os envios ao TMS.

### FIFA Clearing House (Paris)
* **O que é**: Uma câmara de compensação regulatória automatizada que processa pagamentos internacionais para verificar e distribuir o **Mecanismo de Solidariedade** (normalmente 5% de qualquer taxa de transferência dividida proporcionalmente entre os clubes que formaram o jogador dos 12 aos 23 anos).
* **A Restrição**: Atualmente roda inteiramente em vias bancárias tradicionais. O ePass modela isso permitindo que clubes formadores tokenizem seus direitos futuros de solidariedade, fornecendo financiamento imediato para infraestrutura de base.

### CBF BID (Boletim Informativo Diário - Brasil)
* **O que é**: O sistema nacional de registro operado pela Confederação Brasileira de Futebol (CBF). Um jogador só tem condição legal de jogo em partidas oficiais uma vez que seu contrato especial de trabalho (CETD) esteja registrado e publicado no BID.
* **A Restrição**: Atualizações de status on-chain devem espelhar os registros do BID, que serve como o gatilho legal para validação de contratos ativos.

---

## 3. Tipologia de Contratos no Futebol

O ePass lida com três categorias distintas de contratos legais ao tokenizar ativos de atletas:

### 1. Transfer Agreement (Contrato de Transferência entre Clubes)
Um acordo assinado exclusivamente entre o clube vendedor e o comprador.
* **Termos-Chave**: Valor de transferência, cronogramas de pagamento (parcelas), contas bancárias de destino, cláusulas de porcentagem de revenda futura e bônus de performance.
* **Escopo de Tokenização**: Bloqueado no cofre (escrow) para colateralizar o empréstimo inicial em USDC.

### 2. CETD (Contrato Especial de Trabalho Desportivo)
O contrato de trabalho de natureza CLT entre o jogador e seu clube empregador.
* **Termos-Chave**: Salário base, luvas (bônus de assinatura), duração do contrato (geralmente limitado a 5 anos) e cláusulas rescisórias (multas).
* **Escopo de Tokenização**: Rege parâmetros padrão (duração do contrato e penalidades de rescisão antecipada).

### 3. Contrato de Licenciamento de Imagem (Contrato Civil)
Um contrato de natureza civil (não trabalhista) assinado entre o clube e uma pessoa jurídica (PJ) de propriedade do jogador.
* **Termos-Chave**: Direitos de licenciamento da imagem do jogador para marketing do clube e distribuições de patrocínio.
* **A Regra**: No Brasil, os direitos de imagem são legalmente limitados a **40% da remuneração total do jogador** para evitar evasão fiscal trabalhista por parte dos clubes.
* **Escopo de Tokenização**: Este recebível civil é a classe de ativo mais fácil de fracionar em ERC-20s (`$P_IMAGE`) por operar sob direito civil comum, e não regulamentos sindicais trabalhistas rígidos.

---

## 4. Integração Social e Categoria de Base

Na América Latina e ligas de base, os clubes funcionam fortemente como projetos sociais e academias de formação (*formadores*). Eles investem pesadamente em alimentação, educação e treinamento de jovens jogadores, com a expectativa de recuperar os custos por meio de compensações futuras de treinamento e mecanismos de solidariedade quando estes se tornarem profissionais.

### Fluxo de Tokenização Social no ePass
Para apoiar esses clubes formadores, o ePass estende sua capacidade de tokenização para os mecanismos futuros de solidariedade:
1. **Registro de Formação**: Uma academia registra o histórico de treinamento de um jovem atleta on-chain.
2. **Tokenização da Solidariedade**: A academia cunha um contrato fracionado representando seus recebíveis de solidariedade futuros de 0,5% a 5% daquele jogador.
3. **Micro-investimentos**: Apoiadores locais e investidores Web3 globais compram essas micro-frações.
4. **Reinvestimento Social**: Os stablecoins obtidos são reinvestidos diretamente na infraestrutura da base (campos de treino, material escolar, equipamentos médicos, salários de treinadores).
5. **Liquidação Futura**: Quando o jogador é contratado profissionalmente ou transferido internacionalmente, a Gnosis Safe SPV recolhe a compensação da FIFA Clearing House, convertendo-a em stablecoins para pagar os micro-investidores.
