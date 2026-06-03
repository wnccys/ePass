// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPlayerRightsMaster {
    function mintRights(address recipient, string calldata uri) external returns (uint256);
}

contract RightsMinter is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant MINT_AGREEMENT_TYPEHASH = keccak256(
        "MintAgreement(address player,address club,address attorney,string tokenURI,uint256 nonce,uint256 deadline)"
    );

    address public masterNftAddress;

    mapping(bytes32 => bool) public executedAgreements;

    error SignatureExpired();
    error InvalidSignature(address expected);
    error ZeroAddress();
    error MasterNotConfigured();
    error AgreementAlreadyExecuted();

    event MasterNftAddressUpdated(address indexed masterNftAddress);
    event AgreementAuthorized(address indexed player, address indexed club, string tokenURI, uint256 tokenId);

    struct MintAgreement {
        address player;
        address club;
        address attorney;
        string tokenURI;
        uint256 nonce;
        uint256 deadline;
    }

    constructor(address initialOwner) EIP712("RightsMinter", "1") Ownable(initialOwner) {}

    function setMasterNftAddress(address _masterNftAddress) external onlyOwner {
        if (_masterNftAddress == address(0)) revert ZeroAddress();
        masterNftAddress = _masterNftAddress;
        emit MasterNftAddressUpdated(_masterNftAddress);
    }

    function executeMint(
        MintAgreement calldata req,
        bytes calldata playerSig,
        bytes calldata clubSig,
        bytes calldata attorneySig
    ) external nonReentrant returns (uint256 tokenId) {
        if (masterNftAddress == address(0)) revert MasterNotConfigured();
        if (req.player == address(0) || req.club == address(0) || req.attorney == address(0)) revert ZeroAddress();
        if (block.timestamp > req.deadline) revert SignatureExpired();

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_AGREEMENT_TYPEHASH,
                req.player,
                req.club,
                req.attorney,
                keccak256(bytes(req.tokenURI)),
                req.nonce,
                req.deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);

        if (executedAgreements[digest]) revert AgreementAlreadyExecuted();
        executedAgreements[digest] = true;

        if (digest.recover(playerSig) != req.player) revert InvalidSignature(req.player);
        if (digest.recover(clubSig) != req.club) revert InvalidSignature(req.club);
        if (digest.recover(attorneySig) != req.attorney) revert InvalidSignature(req.attorney);

        tokenId = IPlayerRightsMaster(masterNftAddress).mintRights(req.club, req.tokenURI);

        emit AgreementAuthorized(req.player, req.club, req.tokenURI, tokenId);
    }
}
