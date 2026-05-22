// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";

contract RightsMinterTest is Test {
    RightsMinter minter;
    PlayerRightsMaster masterNft;

    // 1. Define Private Keys for our three signers
    uint256 playerPk = 0xA11CE;
    uint256 clubPk = 0xB0B;
    uint256 attorneyPk = 0xCAD;

    // 2. Derive public addresses from private keys
    address player = vm.addr(playerPk);
    address club = vm.addr(clubPk);
    address attorney = vm.addr(attorneyPk);

    function setUp() public {
        // Deploy both contracts, making the test contract the initial owner/admin
        minter = new RightsMinter(address(this));
        masterNft = new PlayerRightsMaster(address(this));

        // Tell the gateway where the NFT contract is
        minter.setMasterNftAddress(address(masterNft));

        // Tell the NFT contract that ONLY the gateway is allowed to mint
        masterNft.setAuthorizedMinter(address(minter));
    }

    /** Prevents replay attacks */
    function _getDomainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("RightsMinter")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(minter)
                )
            );
    }

    function _getDigest(
        RightsMinter.MintAgreement memory req
    ) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                minter.MINT_AGREEMENT_TYPEHASH(),
                req.player,
                req.club,
                req.attorney,
                keccak256(bytes(req.tokenURI)),
                req.nonce,
                req.deadline
            )
        );
        return
            keccak256(
                // \x19\x01: Is a mandatory prefix required by Ethereum (EIP-191/EIP-712).
                // It tells the Ethereum virtual machine: "Hey, this isn't a raw transaction to move funds. This is a signed message intended for a smart contract."
                abi.encodePacked("\x19\x01", _getDomainSeparator(), structHash)
            );
    }

    function _signAgreement(
        RightsMinter.MintAgreement memory req,
        uint256 pk
    ) internal view returns (bytes memory) {
        bytes32 digest = _getDigest(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_ExecuteMintSuccess() public {
        RightsMinter.MintAgreement memory agreement = RightsMinter
            .MintAgreement({
                player: player,
                club: club,
                attorney: attorney,
                tokenURI: "ipfs://QmLegalDocs",
                nonce: 0,
                deadline: block.timestamp + 1 hours
            });

        bytes memory playerSig = _signAgreement(agreement, playerPk);
        bytes memory clubSig = _signAgreement(agreement, clubPk);
        bytes memory attorneySig = _signAgreement(agreement, attorneyPk);

        vm.expectEmit(true, true, false, true);
        emit RightsMinter.AgreementAuthorized(
            player,
            club,
            "ipfs://QmLegalDocs"
        );

        // Execute the multi-sig transaction
        minter.executeMint(agreement, playerSig, clubSig, attorneySig);

        // Prove the Club received exactly 1 NFT (Token ID 1)
        assertEq(masterNft.ownerOf(1), club);

        // Prove the legal document URI is permanently attached to the NFT
        assertEq(masterNft.tokenURI(1), "ipfs://QmLegalDocs");
    }

    function test_RevertIf_SignatureIsInvalid() public {
        // Here we're basically saying: this specific agreement which will be verified by executeMint MUST have the player, club and attorney passed here (EXACTLY).
        // That's preciselly why the test fail, malicious cannot sign.
        RightsMinter.MintAgreement memory agreement = RightsMinter
            .MintAgreement({
                player: player,
                club: club,
                attorney: attorney,
                tokenURI: "ipfs://QmLegalDocs",
                nonce: 0,
                deadline: block.timestamp + 1 hours
            });

        bytes memory playerSig = _signAgreement(agreement, playerPk);
        bytes memory clubSig = _signAgreement(agreement, clubPk);

        uint256 maliciousPk = 0xBAD;
        bytes memory maliciousSig = _signAgreement(agreement, maliciousPk);

        vm.expectRevert(
            abi.encodeWithSelector(
                RightsMinter.InvalidSignature.selector,
                attorney
            )
        );
        minter.executeMint(agreement, playerSig, clubSig, maliciousSig);
    }

    function test_RevertIf_ReplayAttack() public {
        RightsMinter.MintAgreement memory agreement = RightsMinter
            .MintAgreement({
                player: player,
                club: club,
                attorney: attorney,
                tokenURI: "ipfs://QmLegalDocs",
                nonce: 0,
                deadline: block.timestamp + 1 hours
            });

        bytes memory playerSig = _signAgreement(agreement, playerPk);
        bytes memory clubSig = _signAgreement(agreement, clubPk);
        bytes memory attorneySig = _signAgreement(agreement, attorneyPk);

        // Valid
        minter.executeMint(agreement, playerSig, clubSig, attorneySig);

        vm.expectRevert();

        // Invalid, a new agreement must be created in order to work
        minter.executeMint(agreement, playerSig, clubSig, attorneySig);
    }
}
