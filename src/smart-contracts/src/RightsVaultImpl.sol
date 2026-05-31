// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title RightsVaultImpl
/// @notice Contrato de implementação (lógica) do vault — compatível com EIP-1167 minimal proxy.
/// @dev Não tem constructor com parâmetros. Usa initialize() protegido pelo Initializable do OZ.
///      Variáveis imutáveis (immutable) foram substituídas por storage normal,
///      pois clones não suportam immutable (gravado no bytecode da impl, não do clone).
contract RightsVaultImpl is
    Initializable,
    ERC20Upgradeable,
    IERC721Receiver,
    OwnableUpgradeable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────
    // CONSTANTES (constantes são seguras — ficam no bytecode da impl)
    // ─────────────────────────────────────────────────────────

    uint256 public constant CONTRACT_DURATION = 365 days;
    uint256 public constant HALF_TIME = CONTRACT_DURATION / 2;
    uint256 public constant TIMESTAMP_BUFFER = 1 days;
    uint256 public constant PENALTY_BPS = 6500;
    uint256 public constant BPS_BASE = 10_000;

    // ─────────────────────────────────────────────────────────
    // ENUM DE ESTADO
    // ─────────────────────────────────────────────────────────

    enum ContractStatus {
        PENDING,     // Aguardando fracionamento + caução
        ACTIVE,      // Caução depositada — contrato em vigor
        RESCINDED,   // Rescisão executada por jogador ou clube
        EXPIRED,     // 12 meses — contrato encerrado naturalmente
        TRANSFERRED  // Clube foi substituído por outro clube
    }

    // ─────────────────────────────────────────────────────────
    // STORAGE
    // Todas as variáveis que seriam immutable viram storage normal,
    // pois o clone não tem bytecode próprio para gravar immutables.
    // ─────────────────────────────────────────────────────────

    IERC721 public masterNft;
    IERC20  public stablecoin;

    address public player;
    address public club;
    address public attorney;

    uint256 public playerBps;
    uint256 public clubBps;
    uint256 public attorneyBps;

    uint256 public lockedTokenId;
    ContractStatus public status;

    uint256 public cautionAmount;
    uint256 public contractStart;
    bool    public fractionalized;

    // ─────────────────────────────────────────────────────────
    // EVENTOS
    // ─────────────────────────────────────────────────────────

    event VaultInitialized(
        address indexed player,
        address indexed club,
        address indexed attorney,
        uint256 playerBps,
        uint256 clubBps,
        uint256 attorneyBps
    );
    event Fractionalized(
        uint256 indexed tokenId,
        uint256 totalShares,
        uint256 playerShares,
        uint256 clubShares,
        uint256 attorneyShares
    );
    event ContractActivated(address indexed club, uint256 cautionAmount, uint256 contractStart);
    event ContractRescindedByPlayer(uint256 toClub, uint256 toPlayer, bool penaltyApplied);
    event ContractRescindedByClub(uint256 toPlayer, uint256 toClub, bool penaltyApplied);
    event ContractExpired(uint256 cautionReturned, address indexed returnedTo);
    event ClubTransferred(address indexed oldClub, address indexed newClub, uint256 transferredShares);

    // ─────────────────────────────────────────────────────────
    // ERROS
    // ─────────────────────────────────────────────────────────

    error AlreadyInitialized();
    error VaultAlreadyFractionalized();
    error NotNFTOwner();
    error NotAuthorized();
    error ContractNotActive();
    error ContractNotPending();
    error WrongCautionAmount();
    error ContractStillActive();
    error InvalidBasisPoints();
    error ZeroAddress();
    error FractionalizationRequired();
    error InvalidNewClub();
    error SupplyCannotBeZero();

    // ─────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // Desabilita a inicialização direta da implementação para
    // garantir que só clones possam ser inicializados.
    // Isso evita que alguém "tome posse" da implementação.
    // ─────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ─────────────────────────────────────────────────────────
    // INITIALIZE — substitui o constructor para os clones
    // ─────────────────────────────────────────────────────────

    /// @notice Inicializa o clone com os dados do contrato.
    /// @dev Chamado pela RightsVaultFactory imediatamente após Clones.clone().
    ///      O modificador initializer do OZ garante que só rode uma vez por clone.
    /// @param _masterNftAddress  Endereço do PlayerRightsMaster
    /// @param _stablecoinAddress Endereço da stablecoin de caução (ex: USDC)
    /// @param _player            Carteira do jogador
    /// @param _club              Carteira do clube / SPV
    /// @param _attorney          Carteira do advogado
    /// @param _playerBps         Fatia do jogador em basis points (ex: 3000 = 30%)
    /// @param _clubBps           Fatia do clube em basis points
    /// @param _attorneyBps       Fatia do advogado em basis points
    /// @param _owner             Endereço que terá ownership do clone (normalmente a factory ou o admin)
    function initialize(
        address _masterNftAddress,
        address _stablecoinAddress,
        address _player,
        address _club,
        address _attorney,
        uint256 _playerBps,
        uint256 _clubBps,
        uint256 _attorneyBps,
        address _owner
    ) external initializer {
        if (
            _masterNftAddress  == address(0) ||
            _stablecoinAddress == address(0) ||
            _player            == address(0) ||
            _club              == address(0) ||
            _attorney          == address(0) ||
            _owner             == address(0)
        ) revert ZeroAddress();

        if (_playerBps + _clubBps + _attorneyBps != BPS_BASE) revert InvalidBasisPoints();

        // Inicializa os contratos base (upgradeable)
        __ERC20_init("Player Image Rights", "P_IMAGE");
        __Ownable_init(_owner);
        

        masterNft   = IERC721(_masterNftAddress);
        stablecoin  = IERC20(_stablecoinAddress);
        player      = _player;
        club        = _club;
        attorney    = _attorney;
        playerBps   = _playerBps;
        clubBps     = _clubBps;
        attorneyBps = _attorneyBps;
        status      = ContractStatus.PENDING;

        emit VaultInitialized(_player, _club, _attorney, _playerBps, _clubBps, _attorneyBps);
    }

    // ─────────────────────────────────────────────────────────
    // FRACIONAMENTO (PENDING)
    // ─────────────────────────────────────────────────────────

    /// @notice Trava o NFT master no clone e minta os tokens P_IMAGE distribuídos por basis points.
    /// @dev O clube deve chamar approve() no PlayerRightsMaster antes desta chamada.
    /// @param _tokenId ID do NFT mestre a ser travado
    /// @param _supply  Quantidade total de tokens P_IMAGE a ser mintada (com 18 decimais)
    function fractionalize(uint256 _tokenId, uint256 _supply) external nonReentrant {
        if (fractionalized) revert VaultAlreadyFractionalized();
        if (status != ContractStatus.PENDING || lockedTokenId != 0) revert VaultAlreadyFractionalized();
        if (msg.sender != club) revert NotAuthorized();
        if (masterNft.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();
        if (_supply == 0) revert SupplyCannotBeZero();

        fractionalized = true;
        lockedTokenId  = _tokenId;

        masterNft.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Distribuição por basis points
        uint256 playerShares   = (_supply * playerBps)   / BPS_BASE;
        uint256 clubShares     = (_supply * clubBps)     / BPS_BASE;
        uint256 attorneyShares = (_supply * attorneyBps) / BPS_BASE;

        // Qualquer resto de divisão inteira fica com o clube para não perder unidades
        uint256 distributed = playerShares + clubShares + attorneyShares;
        clubShares += _supply - distributed;

        _mint(player,   playerShares);
        _mint(club,     clubShares);
        _mint(attorney, attorneyShares);

        emit Fractionalized(_tokenId, _supply, playerShares, clubShares, attorneyShares);
    }

    // ─────────────────────────────────────────────────────────
    // ATIVAÇÃO (PENDING → ACTIVE)
    // ─────────────────────────────────────────────────────────

    /// @notice Clube deposita a caução em stablecoin — ativa o contrato.
    /// @dev O clube deve chamar approve() na stablecoin antes desta chamada.
    ///      Só pode ser chamado após o fracionamento.
    function depositCaution(uint256 _amount) external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (status != ContractStatus.PENDING) revert ContractNotPending();
        if (!fractionalized) revert FractionalizationRequired();
        if (_amount == 0) revert WrongCautionAmount();

        cautionAmount = _amount;
        contractStart = block.timestamp;
        status        = ContractStatus.ACTIVE;

        stablecoin.safeTransferFrom(msg.sender, address(this), _amount);

        emit ContractActivated(msg.sender, _amount, contractStart);
    }

    // ─────────────────────────────────────────────────────────
    // RESCISÃO PELO JOGADOR (ACTIVE → RESCINDED)
    // Antes de 6 meses: 65% vai pro clube, 35% pro jogador
    // Depois de 6 meses: caução volta integralmente pro clube
    // ─────────────────────────────────────────────────────────

    /// @notice Jogador inicia a rescisão do contrato.
    function rescindByPlayer() external nonReentrant {
        if (msg.sender != player) revert NotAuthorized();
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();

        status = ContractStatus.RESCINDED;
        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
        _applyRescission(beforeHalfTime, club, player);
    }

    // ─────────────────────────────────────────────────────────
    // RESCISÃO PELO CLUBE (ACTIVE → RESCINDED)
    // Antes de 6 meses: 65% vai pro jogador, 35% pro clube
    // Depois de 6 meses: caução volta integralmente pro clube
    // ─────────────────────────────────────────────────────────

    /// @notice Clube inicia a rescisão do contrato.
    function rescindByClub() external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();

        status = ContractStatus.RESCINDED;
        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
        _applyRescission(beforeHalfTime, player, club);
    }

    // ─────────────────────────────────────────────────────────
    // EXPIRAÇÃO (ACTIVE → EXPIRED)
    // ─────────────────────────────────────────────────────────

    /// @notice Qualquer parte pode chamar após 12 meses — caução volta integralmente ao clube.
    function expireContract() external nonReentrant {
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();
        if (block.timestamp < contractStart + CONTRACT_DURATION + TIMESTAMP_BUFFER)
            revert ContractStillActive();

        status = ContractStatus.EXPIRED;

        uint256 amount = cautionAmount;
        cautionAmount  = 0;

        stablecoin.safeTransfer(club, amount);

        emit ContractExpired(amount, club);
    }

    // ─────────────────────────────────────────────────────────
    // TRANSFERÊNCIA DE CLUBE
    // ─────────────────────────────────────────────────────────

    /// @notice Transfere a titularidade operacional do clube para outro endereço.
    /// @dev Move o saldo de tokens P_IMAGE do clube antigo para o novo e atualiza o endereço.
    ///      O contrato deve estar em status PENDING ou ACTIVE.
    function transferClub(address _newClub) external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (_newClub == address(0) || _newClub == club) revert InvalidNewClub();
        if (status == ContractStatus.RESCINDED || status == ContractStatus.EXPIRED)
            revert ContractNotActive();

        uint256 clubBalance = balanceOf(club);
        address oldClub     = club;
        club                = _newClub;

        if (clubBalance > 0) {
            _transfer(oldClub, _newClub, clubBalance);
        }

        emit ClubTransferred(oldClub, _newClub, clubBalance);
    }

    // ─────────────────────────────────────────────────────────
    // LÓGICA INTERNA DE RESCISÃO
    // ─────────────────────────────────────────────────────────

    /// @dev CEI pattern: zera cautionAmount antes de transferir para evitar reentrância.
    /// @param _penaltyApplied  true se ainda estamos antes dos 6 meses
    /// @param _penaltyReceiver quem recebe os 65%
    /// @param _remainder       quem recebe os 35%
    function _applyRescission(
        bool _penaltyApplied,
        address _penaltyReceiver,
        address _remainder
    ) internal {
        uint256 amount = cautionAmount;
        cautionAmount  = 0;

        if (_penaltyApplied) {
            uint256 penalty   = (amount * PENALTY_BPS) / BPS_BASE;
            uint256 remaining = amount - penalty;

            stablecoin.safeTransfer(_penaltyReceiver, penalty);
            stablecoin.safeTransfer(_remainder, remaining);

            if (_penaltyReceiver == club) {
                emit ContractRescindedByPlayer(penalty, remaining, true);
            } else {
                emit ContractRescindedByClub(penalty, remaining, true);
            }
        } else {
            stablecoin.safeTransfer(club, amount);

            if (_penaltyReceiver == club) {
                emit ContractRescindedByPlayer(amount, 0, false);
            } else {
                emit ContractRescindedByClub(amount, 0, false);
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // UTILITÁRIOS — DASHBOARD
    // ─────────────────────────────────────────────────────────

    /// @notice Retorna os segundos restantes do contrato. Retorna 0 se inativo.
    function timeRemaining() external view returns (uint256) {
        if (status != ContractStatus.ACTIVE) return 0;
        uint256 end = contractStart + CONTRACT_DURATION;
        if (block.timestamp >= end) return 0;
        return end - block.timestamp;
    }

    /// @notice Retorna true se ainda estamos no primeiro semestre do contrato.
    function isBeforeHalfTime() external view returns (bool) {
        if (status != ContractStatus.ACTIVE) return false;
        return block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
    }

    /// @notice Interface obrigatória para aceitar ERC-721 via safeTransferFrom.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
