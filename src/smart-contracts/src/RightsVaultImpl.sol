// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract RightsVaultImpl is
    Initializable,
    ERC20Upgradeable,
    IERC721Receiver,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    uint256 public constant CONTRACT_DURATION = 365 days;
    uint256 public constant HALF_TIME = CONTRACT_DURATION / 2;
    uint256 public constant TIMESTAMP_BUFFER = 1 days;
    uint256 public constant PENALTY_BPS = 6500;
    uint256 public constant BPS_BASE = 10_000;
    uint256 public constant CAUTION_BPS = 5000; // 50%

    enum ContractStatus {
        PENDING,
        ACTIVE,
        RESCINDED,
        EXPIRED,
        TRANSFERRED
    }

    IERC721 public masterNft;
    IERC20 public stablecoin;

    address public player;
    address public club;
    address public attorney;

    uint256 public playerBps;
    uint256 public clubBps;
    uint256 public attorneyBps;

    uint256 public lockedTokenId;
    ContractStatus public status;

    uint256 public cautionAmount; //O VALOR DO CAUÇÃO VAI PARA CÁ (50% ENCIMA DO DEPOSITO NO depositAndMint)
    uint256 public redeemableReserve; //OUTRA PARTE DO VALOR DO CAUÇÃO VAI PARA CÁ (50%)
    uint256 public totalMintedAgainstReserve;
    uint256 public contractStart;
    bool public fractionalized;

    string private _customName;
    string private _customSymbol;

    event VaultInitialized(
        address indexed player,
        address indexed club,
        address indexed attorney,
        uint256 playerBps,
        uint256 clubBps,
        uint256 attorneyBps,
        string tokenName, /* NOME PROPRIO POR TOKEN DE CONTRATO */
        string tokenSymbol 
    );

    event Fractionalized(
        uint256 indexed tokenId,
        uint256 totalShares,
        uint256 playerShares,
        uint256 clubShares,
        uint256 attorneyShares
    );
    //Conferência do deposito (enveto)
    event ContractActivated(address indexed club, uint256 cautionAmount, uint256 contractStart);


    /// @notice LASTRO DE MINT
    event DepositAndMintExecuted(
        address indexed caller,
        uint256 depositedAmount,
        uint256 cautionAdded,
        uint256 redeemableAdded,
        uint256 mintedShares
    );

    /// @notice LIQUIDAÇÃO DO TOKEN
    event Redeemed(
        address indexed redeemer,
        uint256 burnedShares,
        uint256 stablecoinReturned
    );

    event ContractRescindedByPlayer(uint256 toClub, uint256 toPlayer, bool penaltyApplied);
    event ContractRescindedByClub(uint256 toPlayer, uint256 toClub, bool penaltyApplied);
    event ContractExpired(uint256 cautionReturned, address indexed returnedTo);
    event ClubTransferred(address indexed oldClub, address indexed newClub, uint256 transferredShares);

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
    error InvalidTokenMetadata();
    error InvalidRedeemAmount();
    error RedeemNotAllowedInCurrentState();
    error InsufficientRedeemableReserve();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _masterNftAddress,
        address _stablecoinAddress,
        address _player,
        address _club,
        address _attorney,
        uint256 _playerBps,
        uint256 _clubBps,
        uint256 _attorneyBps,
        address _owner,
        string calldata tokenName_,
        string calldata tokenSymbol_
    ) external initializer {
        if (
            _masterNftAddress == address(0) ||
            _stablecoinAddress == address(0) ||
            _player == address(0) ||
            _club == address(0) ||
            _attorney == address(0) ||
            _owner == address(0)
        ) revert ZeroAddress();

        if (_playerBps + _clubBps + _attorneyBps != BPS_BASE) revert InvalidBasisPoints();
        if (bytes(tokenName_).length == 0 || bytes(tokenSymbol_).length == 0) revert InvalidTokenMetadata();

        __ERC20_init(tokenName_, tokenSymbol_);
        __Ownable_init(_owner);
        __ReentrancyGuard_init();

        masterNft = IERC721(_masterNftAddress);
        stablecoin = IERC20(_stablecoinAddress);

        player = _player;
        club = _club;
        attorney = _attorney;

        playerBps = _playerBps;
        clubBps = _clubBps;
        attorneyBps = _attorneyBps;

        _customName = tokenName_;
        _customSymbol = tokenSymbol_;

        status = ContractStatus.PENDING;

        emit VaultInitialized(
            _player,
            _club,
            _attorney,
            _playerBps,
            _clubBps,
            _attorneyBps,
            tokenName_,
            tokenSymbol_
        );
    }

    function name() public view override returns (string memory) {
        return _customName;
    }

    function symbol() public view override returns (string memory) {
        return _customSymbol;
    }

    function fractionalize(uint256 _tokenId, uint256 _supply) external nonReentrant {
        if (fractionalized) revert VaultAlreadyFractionalized();
        if (status != ContractStatus.PENDING || lockedTokenId != 0) revert VaultAlreadyFractionalized();
        if (msg.sender != club) revert NotAuthorized();
        if (masterNft.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();
        if (_supply == 0) revert SupplyCannotBeZero();

        fractionalized = true;
        lockedTokenId = _tokenId;

        masterNft.safeTransferFrom(msg.sender, address(this), _tokenId);

        uint256 playerShares = (_supply * playerBps) / BPS_BASE;
        uint256 clubShares = (_supply * clubBps) / BPS_BASE;
        uint256 attorneyShares = (_supply * attorneyBps) / BPS_BASE;

        uint256 distributed = playerShares + clubShares + attorneyShares;
        clubShares += _supply - distributed;

        _mint(player, playerShares);
        _mint(club, clubShares);
        _mint(attorney, attorneyShares);

        emit Fractionalized(_tokenId, _supply, playerShares, clubShares, attorneyShares);
    }

    function depositCaution(uint256 _amount) external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (status != ContractStatus.PENDING) revert ContractNotPending();
        if (!fractionalized) revert FractionalizationRequired();
        if (_amount == 0) revert WrongCautionAmount();

        cautionAmount = _amount;
        contractStart = block.timestamp;
        status = ContractStatus.ACTIVE;

        stablecoin.safeTransferFrom(msg.sender, address(this), _amount);

        emit ContractActivated(msg.sender, _amount, contractStart);
    }

    function depositAndMint(uint256 amount) external nonReentrant returns (uint256 mintedShares) {
        if (msg.sender != club) revert NotAuthorized();
        if (!fractionalized) revert FractionalizationRequired();
        if (status != ContractStatus.PENDING && status != ContractStatus.ACTIVE) {
            revert RedeemNotAllowedInCurrentState();
        }
        if (amount == 0) revert WrongCautionAmount();

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        uint256 cautionPart = (amount * CAUTION_BPS) / BPS_BASE;
        uint256 redeemablePart = amount - cautionPart;

        cautionAmount += cautionPart;
        redeemableReserve += redeemablePart;
        mintedShares = redeemablePart;

        totalMintedAgainstReserve += mintedShares;
        _mint(club, mintedShares);

        if (status == ContractStatus.PENDING) {
            contractStart = block.timestamp;
            status = ContractStatus.ACTIVE;
            emit ContractActivated(msg.sender, cautionAmount, contractStart);
        }

        emit DepositAndMintExecuted(msg.sender, amount, cautionPart, redeemablePart, mintedShares);
    }
        // FUNÇÃO REDEEM SÓ FUNCIONA QUANDO O CONTRATO ESTIVER FUNCIONANDO
    function redeem(uint256 shares) external nonReentrant returns (uint256 stablecoinAmount) {
        if (shares == 0) revert InvalidRedeemAmount();

        if (
            status != ContractStatus.ACTIVE &&
            status != ContractStatus.RESCINDED &&
            status != ContractStatus.EXPIRED &&
            status != ContractStatus.TRANSFERRED
        ) {
            revert RedeemNotAllowedInCurrentState();
        }

        if (balanceOf(msg.sender) < shares) revert InvalidRedeemAmount();

        stablecoinAmount = previewRedeem(shares);

        if (stablecoinAmount == 0) revert InvalidRedeemAmount();
        if (stablecoinAmount > redeemableReserve) revert InsufficientRedeemableReserve();

        _burn(msg.sender, shares);
        redeemableReserve -= stablecoinAmount;

        stablecoin.safeTransfer(msg.sender, stablecoinAmount);

        emit Redeemed(msg.sender, shares, stablecoinAmount);
    }

    function rescindByPlayer() external nonReentrant {
        if (msg.sender != player) revert NotAuthorized();
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();

        status = ContractStatus.RESCINDED;
        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
        _applyRescission(beforeHalfTime, club, player);
    }

    function rescindByClub() external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();

        status = ContractStatus.RESCINDED;
        bool beforeHalfTime = block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
        _applyRescission(beforeHalfTime, player, club);
    }

    function expireContract() external nonReentrant {
        if (status != ContractStatus.ACTIVE) revert ContractNotActive();
        if (block.timestamp < contractStart + CONTRACT_DURATION + TIMESTAMP_BUFFER) {
            revert ContractStillActive();
        }

        status = ContractStatus.EXPIRED;

        uint256 amount = cautionAmount;
        cautionAmount = 0;

        stablecoin.safeTransfer(club, amount);

        emit ContractExpired(amount, club);
    }

    function transferClub(address _newClub) external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (_newClub == address(0) || _newClub == club) revert InvalidNewClub();
        if (status == ContractStatus.RESCINDED || status == ContractStatus.EXPIRED) {
            revert ContractNotActive();
        }

        uint256 clubBalance = balanceOf(club);
        address oldClub = club;
        club = _newClub;
        status = ContractStatus.TRANSFERRED;

        if (clubBalance > 0) {
            _transfer(oldClub, _newClub, clubBalance);
        }

        emit ClubTransferred(oldClub, _newClub, clubBalance);
    }
        // MOSTRA QUANDO O USDC SAI!!
    function previewRedeem(uint256 shares) public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        if (shares == 0 || currentSupply == 0) return 0;
        return (shares * redeemableReserve) / currentSupply; //calculo para ser proporcional ao supply atual
    }
    // RETORNA O ESTADO FINANCEIRO RESUMIDO
    function getFinancialState()
        external
        view
        returns (
            uint256 _cautionAmount,
            uint256 _redeemableReserve,
            uint256 _totalSupply,
            uint256 _clubBalance,
            ContractStatus _status
        )
    {
        return (
            cautionAmount,
            redeemableReserve,
            totalSupply(),
            balanceOf(club),
            status
        );
    }
    // CRIA UM BOTÃO F/T PARA HABILITAR NO FRONT
    function canRedeem() external view returns (bool) {
        return (
            status == ContractStatus.ACTIVE ||
            status == ContractStatus.RESCINDED ||
            status == ContractStatus.EXPIRED ||
            status == ContractStatus.TRANSFERRED
        );
    }

    function _applyRescission(
        bool _penaltyApplied,
        address _penaltyReceiver,
        address _remainder
    ) internal {
        uint256 amount = cautionAmount;
        cautionAmount = 0;

        if (_penaltyApplied) {
            uint256 penalty = (amount * PENALTY_BPS) / BPS_BASE;
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

    function timeRemaining() external view returns (uint256) {
        if (status != ContractStatus.ACTIVE) return 0;
        uint256 end = contractStart + CONTRACT_DURATION;
        if (block.timestamp >= end) return 0;
        return end - block.timestamp;
    }

    function isBeforeHalfTime() external view returns (bool) {
        if (status != ContractStatus.ACTIVE) return false;
        return block.timestamp < contractStart + HALF_TIME + TIMESTAMP_BUFFER;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}