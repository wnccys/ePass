# Guia do Clube: Gerenciando Contratos de Jogadores e Ativos On-Chain

Bem-vindo ao Portal do Clube do ePass. Este guia explica como os clubes de futebol podem concluir o onboarding, emitir contratos de jogadores, fracionar direitos e gerenciar o ciclo de vida dos contratos.

---

## 1. Primeiros Passos e Onboarding

Para gerenciar contratos de jogadores no ePass, seu clube deve concluir o onboarding:
1. **Login**: Faça login usando a conta Google oficial do clube via Google OAuth.
2. **Selecionar Perfil**: Escolha **Clube** como seu perfil de conta.
3. **Linkar Carteira**: Conecte o endereço da sua carteira Web3.
   * *Nota*: Como pessoa jurídica, recomendamos fortemente linkar o endereço da sua conta multi-assinatura **Safe (Gnosis Safe)** para garantir governança corporativa segura.

---

## 2. Criando um Contrato

Para tokenizar os direitos de um jogador, você deve rascunhar e executar um novo acordo:
1. **Navegue até "Novo Contrato"**: Abra o formulário de criação de contratos.
2. **Fornecer Detalhes**:
   * Endereços das carteiras do Jogador e do Advogado.
   * Valor total da transferência.
   * Porcentagens de divisão em Basis Points (BPS) para o Jogador, Clube e Advogado (deve somar exatamente 10.000 / 100%).
   * Nome e Símbolo personalizados do token (ex: `$P_NEYMAR`) para as frações.
   * Duração do contrato e cláusulas de rescisão.
3. **Upload de Documento**: Faça o upload do PDF do contrato físico. O backend realiza o upload para o IPFS e retorna o hash do documento (CID).
4. **Assinatura Off-Chain**: O Jogador e o Advogado assinam o acordo off-chain utilizando suas carteiras (dados estruturados EIP-712).
5. **Liquidação On-Chain**: Uma vez coletadas as assinaturas, proponha e execute a transação para cunhar o NFT Master que representa o contrato.

---

## 3. Fracionando e Ativando o Cofre (Vault)

Uma vez que o NFT Master é cunhado para o endereço do seu clube, você pode fracionar o ativo para destravar liquidez:
1. **Criar o Vault**: Faça o deploy de um cofre clone do contrato do jogador.
2. **Aprovar NFT**: Autorize o novo clone do cofre a receber o NFT Master.
3. **Fracionar**: Chame a função `fractionalize` no clone do cofre. O cofre bloqueia o NFT e distribui as cotas ERC-20 iniciais para o Jogador, Clube e Advogado de acordo com os BPS configurados.
4. **Ativar o Contrato**:
   * **Opção A (Caução Pura)**: Deposite o valor de caução exigido (`cautionAmount`) em stablecoins (USDC) para ativar o contrato.
   * **Opção B (Depositar e Cunhar)**: Deposite stablecoins para dividir **50%** para caução bloqueada e **50%** para a reserva resgatável, cunhando novas cotas de valor equivalente de volta para seu clube.
   * *O status do contrato passa para `ACTIVE`.*

---

## 4. Gerenciamento do Ciclo de Vida do Contrato

### Depósitos de Rendimentos e Resgates
* **Financiando a Reserva**: Deposite stablecoins adicionais via `depositAndMint` para lastrear o valor das cotas do jogador.
* **Resgatando Cotas**: Queime suas cotas `$P_IMAGE` a qualquer momento para resgatar seu valor proporcional em USDC da reserva resgatável do cofre.

### Rescisão Antecipada
* Se o jogador rescindir o contrato antes da metade do tempo (182,5 dias), você recebe **65%** do caução em custódia como penalidade.
* Se o clube rescindir o contrato antes da metade do tempo, **65%** do caução vai para o jogador como penalidade.
* Se qualquer uma das partes rescindir após o marco de metade do tempo, **100%** do caução é devolvido ao seu clube.

### Expirar Contrato
* Após 365 dias, o termo do contrato termina naturalmente. O clube pode expirar o contrato, o que libera **100%** do caução de volta para o clube, mantendo os rendimentos das cotas acumulados intactos.

### Transferência de Jogadores (Venda)
* Transfira o ativo do jogador para um novo clube chamando `transferClub(newClub)`. Isso atualiza o endereço do clube proprietário do cofre e transfere automaticamente todas as suas cotas de clube restantes para ele.
