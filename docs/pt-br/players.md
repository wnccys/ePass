# Guia do Jogador: Assinando Contratos e Acompanhando Cotas

Bem-vindo ao Portal do Jogador do ePass. Este guia explica como os atletas de futebol podem concluir o onboarding, assinar acordos de forma off-chain, acompanhar suas cotas de contrato e resgatar fundos.

---

## 1. Primeiros Passos e Onboarding

Para visualizar e assinar contratos no ePass, você deve configurar seu perfil:
1. **Login**: Faça login usando sua conta Google via Google OAuth.
2. **Selecionar Perfil**: Escolha **Jogador** como seu perfil de conta.
3. **Linkar Carteira**: Conecte o endereço da sua carteira Web3 (ex: MetaMask ou WalletConnect).
   * *Nota*: Esta carteira é onde você receberá suas cotas de contrato (tokens) e resgates de stablecoin.

---

## 2. Revisando e Assinando Contratos

Quando um clube rascunhar um novo contrato com você, ele aparecerá no seu painel:
1. **Navegue até "Meus Contratos"**: Visualize os acordos pendentes.
2. **Revisar PDF**: Clique no contrato pendente para abrir a pré-visualização do PDF legal. Verifique a data de início, data de término, valor total, porcentagens de divisão e metadados do token.
3. **Assinar Off-Chain**: 
   * Clique em **Assinar Acordo**.
   * Sua carteira Web3 solicitará que você assine uma mensagem criptograficamente estruturada (EIP-712).
   * **Sem Taxa de Gás**: Como esta assinatura é feita de forma off-chain, ela não custa nenhuma taxa de gás.
4. **Alinhamento de Consentimento**: O acordo é salvo no banco de dados. Uma vez que você, o clube e o seu advogado tenham assinado, o clube executará o contrato on-chain para cunhar o NFT Master.

---

## 3. Acompanhando Cotas e Resgatando USDC

Uma vez que seu contrato seja ativado na blockchain:
* **Cotas de Token**: Você receberá automaticamente sua fatia de tokens ERC-20 `$P_IMAGE` diretamente na sua carteira Web3 vinculada (de acordo com a porcentagem acordada no contrato, ex: 30%).
* **Resgatando Rendimentos**:
  * À medida que patrocinadores ou clubes depositam fundos na reserva do cofre, suas cotas representam valor real resgatável.
  * Você pode chamar a função **Resgatar** no painel do seu contrato ativo para queimar uma parte dos seus tokens `$P_IMAGE` e sacar o valor proporcional em stablecoins USDC.

---

## 4. Rescisão e Término do Contrato

### Rescisão Antecipada
* **Antes de 6 Meses** (Metade do tempo): Se você decidir rescindir o contrato antes do prazo (182,5 dias), uma **penalidade de 65%** é aplicada sobre o caução em custódia. O clube recebe 65% do caução, e você recebe os 35% restantes.
* **Após 6 Meses**: Nenhuma penalidade é aplicada. O valor integral do caução é devolvido ao clube.
* *Para executar isso, clique em "Rescindir Contrato" na página de detalhes do seu contrato ativo.*

### Expiração do Contrato
* Após 365 dias, a vigência do contrato chega ao fim de forma natural. O clube pode expirar o contrato, o que devolve o caução ao clube, enquanto seus rendimentos de cotas e tokens permanecem totalmente intocados sob sua custódia.
