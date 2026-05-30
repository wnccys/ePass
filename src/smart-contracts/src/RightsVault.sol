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
    uint256 public constant HALF_TIME = CONTRACT_DURATION / 2;
    uint256 public constant TIMESTAMP_BUFFER = 1 days;
    uint256 public constant PENALTY_BPS = 6500;
    uint256 public constant BPS_BASE = 10_000;

    enum ContractStatus {
        PENDING,
        ACTIVE,
        RESCINDED,
        EXPIRED,
        TRANSFERRED
    }

    IERC721 public immutable masterNft;
    IERC20 public immutable stablecoin;

    uint256 public lockedTokenId;
    ContractStatus public status;

    address public player;
    address public club;
    address public attorney;

    uint256 public playerBps;
    uint256 public clubBps;
    uint256 public attorneyBps;

    uint256 public cautionAmount;
    uint256 public contractStart;
    bool public fractionalized;

    event Fractionalized(
        uint256 indexed tokenId,
        uint256 totalShares,
        address indexed clubRecipient,
        uint256 playerShares,
        uint256 clubShares,
        uint256 attorneyShares
    );
    event ContractActivated(address indexed club, uint256 cautionAmount, uint256 contractStart);
    event ContractRescindedByPlayer(uint256 toClub, uint256 toPlayer, bool penaltyApplied);
    event ContractRescindedByClub(uint256 toPlayer, uint256 toClub, bool penaltyApplied);
    event ContractExpired(uint256 cautionReturned, address indexed returnedTo);
    event ClubTransferred(address indexed oldClub, address indexed newClub, uint256 indexed tokenId, uint256 transferredShares);

    error VaultAlreadyInitialized();
    error NotNFTOwner();
    error NotAuthorized();
    error ContractNotActive();
    error ContractNotPending();
    error WrongCautionAmount();
    error ContractStillActive();
    error InvalidBasisPoints();
    error ZeroAddress();
    error AlreadyFractionalized();
    error FractionalizationRequired();
    error InvalidNewClub();
    error ClubMustHoldAllClubShares();

    constructor(
        address _masterNftAddress,
        address _stablecoinAddress,
        address _player,
        address _club,
        address _attorney,
        uint256 _playerBps,
        uint256 _clubBps,
        uint256 _attorneyBps,
        address initialOwner
    ) ERC20("Player Image Rights", "P_IMAGE") Ownable(initialOwner) {
        if (
            _masterNftAddress == address(0) ||
            _stablecoinAddress == address(0) ||
            _player == address(0) ||
            _club == address(0) ||
            _attorney == address(0)
        ) revert ZeroAddress();
        if (_playerBps + _clubBps + _attorneyBps != BPS_BASE) revert InvalidBasisPoints();

        masterNft = IERC721(_masterNftAddress);
        stablecoin = IERC20(_stablecoinAddress);

        player = _player;
        club = _club;
        attorney = _attorney;
        playerBps = _playerBps;
        clubBps = _clubBps;
        attorneyBps = _attorneyBps;
        status = ContractStatus.PENDING;
    }

    function fractionalize(uint256 _tokenId, uint256 _supply) external nonReentrant {
        if (fractionalized) revert AlreadyFractionalized();
        if (status != ContractStatus.PENDING || lockedTokenId != 0) revert VaultAlreadyInitialized();
        if (msg.sender != club) revert NotAuthorized();
        if (masterNft.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();
        if (_supply == 0) revert WrongCautionAmount();

        fractionalized = true;
        lockedTokenId = _tokenId;
        masterNft.safeTransferFrom(msg.sender, address(this), _tokenId);

        uint256 playerShares = (_supply * playerBps) / BPS_BASE;
        uint256 clubShares = (_supply * clubBps) / BPS_BASE;
        uint256 attorneyShares = (_supply * attorneyBps) / BPS_BASE;
        uint256 minted = playerShares + clubShares + attorneyShares;
        uint256 remainder = _supply - minted;
        clubShares += remainder;

        _mint(player, playerShares);
        _mint(club, clubShares);
        _mint(attorney, attorneyShares);

        emit Fractionalized(_tokenId, _supply, club, playerShares, clubShares, attorneyShares);
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
        if (block.timestamp < contractStart + CONTRACT_DURATION + TIMESTAMP_BUFFER) revert ContractStillActive();

        status = ContractStatus.EXPIRED;

        uint256 amount = cautionAmount;
        cautionAmount = 0;
        stablecoin.safeTransfer(club, amount);

        emit ContractExpired(amount, club);
    }

    function transferClub(address newClub) external nonReentrant {
        if (msg.sender != club) revert NotAuthorized();
        if (newClub == address(0) || newClub == club) revert InvalidNewClub();
        if (balanceOf(club) == 0) revert ClubMustHoldAllClubShares();
        if (status != ContractStatus.PENDING && status != ContractStatus.ACTIVE) revert ContractNotActive();

        uint256 clubBalance = balanceOf(club);
        _transfer(club, newClub, clubBalance);

        address oldClub = club;
        club = newClub;

        emit ClubTransferred(oldClub, newClub, lockedTokenId, clubBalance);
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
