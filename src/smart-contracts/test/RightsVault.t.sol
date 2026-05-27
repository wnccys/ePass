// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RightsVault is ERC20, IERC721Receiver, Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;

    uint256 public constant CONTRACT_DURATION = 365 days;
    uint256 public constant HALF_TIME         = CONTRACT_DURATION / 2;
    uint256 public constant TIMESTAMP_BUFFER  = 1 days;
    uint256 public constant PENALTY_BPS       = 6500;  // 65%
    uint256 public constant BPS_BASE          = 10000; // 100%

    // TIPOS ENUM

    enum ContractStatus {
        PENDING,    // NFT travado, aguardando deposito
        ACTIVE,     // Caução depositado - contrato em vigor
        RESCINDED,  // Rescisão executada por jogador ou clube
        EXPIRED     // 12 meses enrrando vigência do contrato
    }



    IERC721 public immutable masterNft;
    IERC20  public immutable stablecoin;

    uint256        public lockedTokenId;
    ContractStatus public status;

    address public player;
    address public club;

    uint256 public cautionAmount;
    uint256 public contractStart;


    event Fractionalized(uint256 indexed tokenId, uint256 totalShares, address indexed depositor);
    event ContractActivated(address indexed club, uint256 cautionAmount, uint256 contractStart);
    event ContractRescindedByPlayer(uint256 toClub, uint256 toPlayer, bool penaltyApplied);
    event ContractRescindedByClub(uint256 toPlayer, uint256 toClub, bool penaltyApplied);
    event ContractExpired(uint256 cautionReturned, address indexed returnedTo);


    error VaultAlreadyInitialized();
    error NotNFTOwner();
    error NotAuthorized();
    error ContractNotActive();
    error ContractNotPending();
    error WrongCautionAmount();
    error ContractStillActive();

    constructor(
        address _masterNftAddress,
        address _stablecoinAddress,
        address _player,
        address _club,
        address initialOwner
    ) ERC20("Player Image Rights", "P_IMAGE") Ownable(initialOwner) {
        masterNft  = IERC721(_masterNftAddress);
        stablecoin = IERC20(_stablecoinAddress);
        player     = _player;
        club       = _club;
        status     = ContractStatus.PENDING;
    }


    /// @notice Trava o NFT master e minta tokens P_IMAGE.
    /// @dev    O clube deve chamar approve() no PlayerRightsMaster antes.
    function fractionalize(uint256 _tokenId, uint256 _supply) external {
        if (status != ContractStatus.PENDING || lockedTokenId != 0)
            revert VaultAlreadyInitialized();

        if (msg.sender != club) revert NotAuthorized();

        if (masterNft.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();

        lockedTokenId = _tokenId;
        // @notice safeTransferFrom para caso algum token retorne erro "false" ele refaça sem quebrar.
        masterNft.safeTransferFrom(msg.sender, address(this), _tokenId); 

        _mint(msg.sender, _supply);

        emit Fractionalized(_tokenId, _supply, msg.sender);
    }

    // ATIVAÇÃO (PENDING → ACTIVE)
    /// @notice Clube deposita a caução em stablecoin — ativa o contrato.
    /// @dev    O clube deve chamar approve() na stablecoin antes.
    /// @dev aplicando nonReentrant em todas as entradas de valores
    function depositCaution(uint256 _amount) external nonReentrant {
        if (msg.sender != club)                        revert NotAuthorized();
        if (status != ContractStatus.PENDING)          revert ContractNotPending();
        if (_amount == 0)                              revert WrongCautionAmount();

        cautionAmount = _amount;
        contractStart = block.timestamp;
        status        = ContractStatus.ACTIVE;

        stablecoin.safeTransferFrom(msg.sender, address(this), _amount);

        emit ContractActivated(msg.sender, _amount, contractStart);
    }

    // RESCISÃO PELO JOGADOR (ACTIVE → RESCINDED)
    // Antes de 6 meses: 65% vai pro clube, 35% pro jogador
    // Depois de 6 meses: caução volta integralmente pro clube
    /// @notice Jogador inicia a rescisão do contrato.
    function rescindByPlayer() external nonReentrant {
        if (msg.sender != player)                revert NotAuthorized();
        if (status != ContractStatus.ACTIVE)     revert ContractNotActive();

        status = ContractStatus.RESCINDED;

        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;

        _applyRescission(beforeHalfTime, club, player);
    }


    // RESCISÃO PELO CLUBE (ACTIVE → RESCINDED)
    // Antes de 6 meses: 65% vai pro jogador, 35% pro clube
    // Depois de 6 meses: caução volta integralmente pro clube
    /// @notice Clube inicia a rescisão do contrato.
    function rescindByClub() external nonReentrant {
        if (msg.sender != club)              revert NotAuthorized();
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();

        status = ContractStatus.RESCINDED;

        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;

        _applyRescission(beforeHalfTime, player, club);
    }


    // EXPIRAÇÃO (ACTIVE → EXPIRED)
    /// @notice Qualquer parte pode chamar após 12 meses.
    /// Deposito Caução volta integralmente ao clube.
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

    // LÓGICA DE RESCISÃO
    /// @dev Calcula e distribui a caução conforme a penalidade.
    /// @param _penaltyApplied  true se antes dos 6 meses
    /// @param _penaltyReceiver quem recebe os 65%
    /// @param _remainder       quem recebe os 35%
    function _applyRescission(
        bool    _penaltyApplied,
        address _penaltyReceiver,
        address _remainder
    ) internal {
        uint256 amount = cautionAmount;
        cautionAmount  = 0; // zera antes de transferir — impedir CEI (reentrancia)

        if (_penaltyApplied) {
            uint256 penalty   = (amount * PENALTY_BPS) / BPS_BASE; // 65%
            uint256 remaining = amount - penalty;                   // 35%

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

    // utilitários para painel dashboard
    /// @notice Retorna segundos restantes até o fim do contrato. 0 se inativo.
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

    /// @notice Interface obrigatória para aceitar NFTs via safeTransferFrom.
    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}