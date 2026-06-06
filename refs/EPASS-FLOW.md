# 📘 Mini Doc ePass

--------------------------------------------------------------------------------

## 🏗️ Arquitetura dos Contratos (Atual)

| Contrato             | Responsabilidade                                                              |
|----------------------|-------------------------------------------------------------------------------|
| RightsMinter         | Validar assinatura tripla (EIP-712) e disparar mint do NFT mestre             |
| PlayerRightsMaster   | ERC-721 que representa o NFT mestre dos direitos do jogador (PRM)             |
| RightsVaultImpl      | Implementation do vault upgradeable: trava NFT, emite tokens fracionários,   |
|                      | gerencia caução e redeem                                                      |
| RightsVaultFactory   | Cria vaults via clone (OpenZeppelin Clones) e centraliza configuração de     |
|                      | masterNft/stablecoin                                                          |

### 🔑 Mudanças Principais rispetto à Versão Anterior

| O que mudou             | Por quê                                                    |
|-------------------------|------------------------------------------------------------|
| Factory + Clones        | Padrão proxy para deploy barato e upgradeável              |
| Vault é ERC20Upgradeable| Tokens fracionários são ERC20 com nome/symbol próprios     |
| Liquidez lastreada      | depositAndMint permite criar supply adicional contra       |
|                         | redeemableReserve (novo mecanismo de liquidez)             |
| redeem funcional        | Quem tem shares pode trocar por stablecoin proporcionalmente|
| 5 estados               | PENDING → ACTIVE → RESCINDED/EXPIRED/TRANSFERRED           |
| Penalidade 65%          | Se rescindir antes de 6 meses + 1 dia, 65% vai para quem   |
|                         | rescindiu, 35% para o outro                                |

--------------------------------------------------------------------------------

## 🔄 Fluxo Geral de Chamada (Atualizado)

1. Frontend monta MintAgreement (player, club, attorney, tokenURI, nonce, deadline)
2. Jogador, clube e advogado assinam payload EIP-712
3. Frontend chama RightsMinter.executeMint(...)
   → RightsMinter valida assinaturas + deadline + nonce
   → Chama PlayerRightsMaster.mintRights(...) (NFT vai para o club)
4. Frontend cria NOVO vault chamando RightsVaultFactory.createVault(...)
   → Factory clona RightsVaultImpl e chama initialize(...)
   → Vault retorna endereço novo
5. Clube aprova vault no NFT mestre:
   PlayerRightsMaster.approve(address(vault), tokenId)
6. Clube chama vault.fractionalize(tokenId, totalSupply)
   → NFT mestre trava no vault (safeTransferFrom club → vault)
   → Mint de ERC20: playerShares, clubShares, attorneyShares
7. [OPCIONAL] Clube chama vault.depositAndMint(amount)
   → Deposita stablecoin, 50% vai para cautionAmount, 50% para redeemableReserve
   → Mint de shares adicionais para o club (liquidez extra)
   → Contrato ativa se estava PENDING
8. OU clube chama vault.depositCaution(amount)
   → Deposita caução em stablecoin
   → Contrato passa para ACTIVE
9. Depois disso podem ocorrer: redeem, rescisão, expiração ou transferClub

--------------------------------------------------------------------------------

## 📄 Documentação por Contrato (Atualizada)

### 1. RightsMinter

Responsabilidade:
- Validar acordo assinado pelas 3 partes (EIP-712)
- Evitar replay com executedAgreements[digest]
- Checar deadline
- Mandar mintar NFT mestre no PlayerRightsMaster

Estrutura principal:

MintAgreement {
    address player;
    address club;
    address attorney;
    string tokenURI;
    uint256 nonce;
    uint256 deadline;
}

Funções:
- setMasterNftAddress(address)
  Configura PlayerRightsMaster (imutável após constructor)

- executeMint(MintAgreement req, bytes playerSig, bytes clubSig, bytes attorneySig)
  Valida assinaturas + deadline + nonce → mints NFT → retorna tokenId

Eventos:
- AgreementAuthorized(player, club, tokenURI, tokenId)

Erros:
- SignatureExpired()
- InvalidSignature(address expected)
- ZeroAddress()
- MasterNotConfigured()
- AgreementAlreadyExecuted()

Observações:
- Porta de entrada do protocolo
- Não guarda ativo nenhum, apenas valida acordo

--------------------------------------------------------------------------------

### 2. PlayerRightsMaster

Responsabilidade:
- Representar NFT mestre dos direitos do jogador (ERC721: "Player Rights Master", "PRM")
- Mintar somente quando chamado pelo RightsMinter
- Impedir transferências livres sem autorização (via authorizedOperators)

Funções:
- mintRights(address recipient, string calldata uri)
  Cria NFT mestre, grava tokenURI, envia para recipient

- setAuthorizedMinter(address _minter)
  Define qual contrato pode mintar (ex: RightsMinter)

- setAuthorizedOperator(address operator, bool allowed)
  Autoriza operadores externos para mover NFT controladamente

Eventos:
- RightsMinted(tokenId, recipient, tokenURI)
- AuthorizedMinterUpdated(minter)
- OperatorAuthorizationUpdated(operator, allowed)

Erros:
- CallerNotAuthorized()
- ZeroAddress()

Observações:
- NFT fica com o clube (não com jogador)
- Jogador assina acordo, mas não é custodiante do NFT

--------------------------------------------------------------------------------

### 3. RightsVaultFactory

Responsabilidade:
- Criar novos vaults via clone (OpenZeppelin Clones)
- Centralizar configuração de masterNftAddress e stablecoinAddress
- Mapear vaults por clube e jogador

Estado principal:

address public immutable implementation;  // RightsVaultImpl
address public masterNftAddress;          // PlayerRightsMaster
address public stablecoinAddress;         // USDC/USDT
mapping(address => address[]) _vaultsByClub;
mapping(address => address[]) _vaultsByPlayer;

Funções:
- setMasterNftAddress(address)
  Update masterNft (onlyOwner)

- setStablecoinAddress(address)
  Update stablecoin (onlyOwner)

- createVault(player, club, attorney, playerBps, clubBps, attorneyBps, tokenName, tokenSymbol)
  Clona vault → initialize → retorna endereço

- getAllVaults()
  Lista todos vaults

- getVaultsByClub(club)
  Vaults de um clube

- getVaultsByPlayer(player)
  Vaults de um jogador

- totalVaults()
  Conta total de vaults

Eventos:
- VaultCreated(vault, player, club, attorney, playerBps, clubBps, attorneyBps, tokenName, tokenSymbol)
- MasterNftAddressUpdated(address)
- StablecoinAddressUpdated(address)

Erros:
- ZeroAddress()
- InvalidBasisPoints()
- InvalidTokenMetadata()

Observações:
- Padrão Clones (não é EIP-1167 antigo)
- Cada vault é ERC20 com nome/symbol próprios (ex: "Player X Rights Token", "PXRT")

--------------------------------------------------------------------------------

### 4. RightsVaultImpl (Vault)

Responsabilidade:
- Travar NFT mestre (masterNft.safeTransferFrom → address(this))
- Emitir tokens fracionários ERC20Upgradeable (nome/symbol custom per-token)
- Guardar e controlar caução em stablecoin (cautionAmount + redeemableReserve)
- Permitir redeem de shares por stablecoin proporcional
- Tratar rescisão (com penalty 65% antes de 6 meses) e expiração
- Funcionar como cofre lógico do contrato

Estado principal:

IERC721 public masterNft;          // PlayerRightsMaster
IERC20 public stablecoin;          // USDC/USDT
address public player;
address public club;
address public attorney;
uint256 public playerBps;          // deve soma 10.000 com clubBps + attorneyBps
uint256 public clubBps;
uint256 public attorneyBps;
uint256 public lockedTokenId;
ContractStatus public status;      // PENDING/ACTIVE/RESCINDED/EXPIRED/TRANSFERRED
uint256 public cautionAmount;      // 50% do depósito (garantia)
uint256 public redeemableReserve;  // 50% do depósito (liquidez para redeem)
uint256 public totalMintedAgainstReserve;
uint256 public contractStart;
bool public fractionalized;
string private _customName;        // Nome ERC20 específico deste vault
string private _customSymbol;      // Symbol ERC20 específico deste vault

Estados do contrato:

| Status      | Quando                                           |
|-------------|--------------------------------------------------|
| PENDING     | Após initialize, antes de fractionalize + deposit|
| ACTIVE      | Após depositCaution ou depositAndMint            |
| RESCINDED   | Player ou club rescinde                          |
| EXPIRED     | Após 365 dias, caução retorna 100% ao club       |
| TRANSFERRED | Club transferido para novo endereço              |

Funções principais:
- initialize(...)
  Configura vault (only via Factory clone)

- fractionalize(uint256 _tokenId, uint256 _supply)
  Trava NFT, mints ERC20: playerShares, clubShares, attorneyShares

- depositCaution(uint256 _amount)
  Deposita caução, ativa contrato (PENDING → ACTIVE)

- depositAndMint(uint256 amount)
  NOVO: 50% caution, 50% redeemable, mint shares adicionais para club (liquidez)

- redeem(uint256 shares)
  Burn shares, recebe stablecoin proporcional (previewRedeem)

- previewRedeem(uint256 shares)
  Retorna quant stablecoin o user recebe por shares

- rescindByPlayer()
  Player rescinde (penalty se < 6 meses)

- rescindByClub()
  Club rescinde (penalty se < 6 meses)

- expireContract()
  Após 365 dias, cautionAmount → club (100%)

- transferClub(address _newClub)
  Muda club, move shares, status → TRANSFERRED

- timeRemaining()
  Tempo restante (days)

- isBeforeHalfTime()
  bool: antes de 182.5 days + 1 day buffer

- canRedeem()
  bool: se redeem está permitido (ACTIVE/RESCINDED/EXPIRED/TRANSFERRED)

- getFinancialState()
  Retorna (cautionAmount, redeemableReserve, totalSupply, clubBalance, status)

- name() / symbol()
  Nome e symbol do ERC20 (custom per vault)

- onERC721Received(...)
  Permite receber NFT via safeTransferFrom

Eventos:
- VaultInitialized(...)
- Fractionalized(tokenId, totalShares, playerShares, clubShares, attorneyShares)
- ContractActivated(club, cautionAmount, contractStart)
- DepositAndMintExecuted(caller, depositedAmount, cautionPart, redeemablePart, mintedShares) NOVO
- Redeemed(redeemer, burnedShares, stablecoinReturned) NOVO
- ContractRescindedByPlayer(toClub, toPlayer, penaltyApplied)
- ContractRescindedByClub(toPlayer, toClub, penaltyApplied)
- ContractExpired(cautionReturned, returnedTo)
- ClubTransferred(oldClub, newClub, transferredShares)

Erros:
- VaultAlreadyFractionalized()
- NotNFTOwner()
- NotAuthorized()
- ContractNotActive()
- ContractNotPending()
- WrongCautionAmount()
- ContractStillActive()
- InvalidBasisPoints()
- ZeroAddress()
- FractionalizationRequired()
- InvalidNewClub()
- SupplyCannotBeZero()
- InvalidTokenMetadata()
- InvalidRedeemAmount()
- RedeemNotAllowedInCurrentState()
- InsufficientRedeemableReserve()

Observações importantes:
- Vault não é tesouraria salarial, é lógica financeira do contrato
- Tokens ERC20 são divididos entre player, club e attorney conforme bps
- Caução = garantia do vínculo (50% caution + 50% redeemable)
- Penalidade 65% se rescindir antes de contractStart + HALF_TIME + 1 day
- redeemableReserve é a liquidez para redeem (quem burns shares recebe proporcional)

--------------------------------------------------------------------------------

## 🖥️ Fluxo de Integração no Frontend (Atualizado)

### Etapa 1 — Assinatura

Frontend monta MintAgreement:

{
  player: "0xPlayer...",
  club: "0xClub...",
  attorney: "0xAttorney...",
  tokenURI: "ipfs://...",
  nonce: 1,
  deadline: 1717200000
}

Coleta 3 assinaturas EIP-712 (wagmi + viem).

### Etapa 2 — Mint do NFT

rightsMinter.write.executeMint([agreement, playerSig, clubSig, attorneySig])

→ Retorna tokenId do NFT mestre.

### Etapa 3 — Criação do Vault (NOVO)

factory.write.createVault([
  player, club, attorney,
  playerBps, clubBps, attorneyBps,  // ex: [5000, 4500, 500]
  tokenName, tokenSymbol             // ex: ["Player X Rights", "PXRT"]
])

→ Retorna vaultAddress (clone novo).

### Etapa 4 — Aprovação do NFT

Clube aprova vault no NFT:

playerRightsMaster.write.approve([vaultAddress, tokenId])

### Etapa 5 — Fracionamento

Clube chama:

vault.write.fractionalize([tokenId, totalSupply])  // ex: [tokenId, 10000]

→ NFT trava no vault, ERC20 mints para player/club/attorney.

### Etapa 6 — Caução (2 opções)

OPÇÃO A: Caução simples (fluxo antigo)

vault.write.depositCaution([cautionAmount])  // ex: [100000] (100k USDC)

OPÇÃO B: Liquidez + Caução (NOVO)

vault.write.depositAndMint([amount])  // ex: [200000]

→ 100k caution, 100k redeemableReserve, mint 100k shares para club.

### Etapa 7 — Ciclo de Vida

Depois disso, frontend pode:

- vault.read.canRedeem() → habilitar botão redeem
- vault.write.redeem([shares]) → user burns shares, recebe stablecoin
- vault.read.timeRemaining() → mostra dias restantes
- vault.read.isBeforeHalfTime() → mostra se penalty aplica
- vault.write.rescindByPlayer() / rescindByClub()
- vault.write.expireContract()
- vault.write.transferClub([newClub])

--------------------------------------------------------------------------------

## 📌 Tarefas de Conexão

### No Frontend (wagmi + viem)

- Assinatura EIP-712 (wagmi useSignTypedData)
- Chamada executeMint (RightsMinter)
- Chamada createVault (RightsVaultFactory) NOVO
- Chamada approve (PlayerRightsMaster)
- Chamada fractionalize (vault)
- Chamada depositCaution OU depositAndMint (vault)
- Leitura de estados: canRedeem, timeRemaining, isBeforeHalfTime, getFinancialState
- Listener de eventos: VaultCreated, Fractionalized, ContractActivated, Redeemed, ContractRescinded...*

### No Backend

- Montagem do payload MintAgreement
- Persistência opcional dos dados do acordo
- Validação de status (via subgraph ou indexador)
- Indexação de eventos
- Armazenamento de metadata/IPFS

--------------------------------------------------------------------------------

## 🌐 Endereços para Configurar (NÃO hardcoded)

Esses valores vêm de .env ou contrato de config:

| Config                      | Descrição                              |
|-----------------------------|----------------------------------------|
| PLAYER_RIGHTS_MASTER_ADDRESS| PlayerRightsMaster (ERC721)           |
| RIGHTS_MINTER_ADDRESS       | RightsMinter                          |
| RIGHTS_VAULT_FACTORY_ADDRESS| RightsVaultFactory                    |
| STABLECOIN_ADDRESS          | USDC/USDT (IERC20)                    |
| PLAYER_ADDRESS              | Jogador (via wallet connect)          |
| CLUB_ADDRESS                | Clube (via wallet connect ou config)  |
| ATTORNEY_ADDRESS            | Advogado (config)                     |
| AUTHORIZED_OPERATORS        | Lista de operadores para transfer NFT |

--------------------------------------------------------------------------------

## ⚠️ Notas Importantes (Atualizadas)

1. NFT mestre fica com o clube (não com jogador)
2. Jogador assina, mas não custodiar NFT
3. Vault não é tesouraria de salário
4. Contrato valoriza direito de imagem + organiza relação jurídica/econômica
5. Padrão atual: OpenZeppelin Clones (não É EIP-1167 antigo, não É deploy direto)
6. ERC20 per-vault tem nome/symbol próprios (ex: "PXRT")
7. depositAndMint cria liquidez extra (50% caution + 50% redeemable + mint shares)
8. redeem permite trocar shares por stablecoin proporcionalmente
9. Penalidade 65% se rescindir antes de 6 meses + 1 dia
10. Em expiração, caução 100% vai para club (mesmo player tenha shares)

--------------------------------------------------------------------------------
