// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Nonces} from "openzeppelin-contracts/contracts/utils/Nonces.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

interface IPlayerRightsMaster {
    function mintRights(
        address recipient,
        string calldata uri
    ) external returns (uint256);
}

contract RightsMinter is EIP712, Nonces, Ownable {
    using ECDSA for bytes32;

    address public masterNftAddress;

    // Define the EIP-712 TypeHash
    // Note: dynamic types like 'string' are hashed in the actual struct encoding
    bytes32 public constant MINT_AGREEMENT_TYPEHASH =
        keccak256(
            "MintAgreement(address player,address club,address attorney,string tokenURI,uint256 nonce,uint256 deadline)"
        );

    error SignatureExpired();
    error InvalidSignature(address expected);

    // Event to signal successful authorization (will later trigger the actual NFT mint)
    event AgreementAuthorized(
        address indexed player,
        address indexed club,
        string tokenURI
    );

    constructor(
        address initialOwner
    ) EIP712("RightsMinter", "1") Ownable(initialOwner) {}

    function setMasterNftAddress(address _masterNftAddress) external onlyOwner {
        masterNftAddress = _masterNftAddress;
    }

    struct MintAgreement {
        address player;
        address club;
        address attorney;
        string tokenURI;
        uint256 nonce;
        uint256 deadline;
    }

    /**
     * @notice Executes the agreement if all three parties have provided valid EIP-712 signatures.
     */
    function executeMint(
        MintAgreement calldata req,
        bytes calldata playerSig,
        bytes calldata clubSig,
        bytes calldata attorneySig
    ) external {
        // Check deadline to prevent stale transactions
        if (block.timestamp > req.deadline) revert SignatureExpired();

        // Prevent replay attacks. We track the nonce against the player's address.
        // This OZ v5 function automatically increments the nonce and reverts if the provided nonce is wrong.
        _useCheckedNonce(req.player, req.nonce);

        // Hash the struct payload
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_AGREEMENT_TYPEHASH,
                req.player,
                req.club,
                req.attorney,
                keccak256(bytes(req.tokenURI)), // Dynamic types must be hashed
                req.nonce,
                req.deadline
            )
        );

        // Combine with the Domain Separator
        bytes32 digest = _hashTypedDataV4(structHash);

        // Recover and verify all three signatures
        if (digest.recover(playerSig) != req.player)
            revert InvalidSignature(req.player);
        if (digest.recover(clubSig) != req.club)
            revert InvalidSignature(req.club);
        if (digest.recover(attorneySig) != req.attorney)
            revert InvalidSignature(req.attorney);

        IPlayerRightsMaster(masterNftAddress).mintRights(
            req.club,
            req.tokenURI
        ); // Minting to the Club or SPV Safe

        emit AgreementAuthorized(req.player, req.club, req.tokenURI);
    }
}
