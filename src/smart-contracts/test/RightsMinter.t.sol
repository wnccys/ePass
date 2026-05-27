// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";

contract RightsMinterTest is Test {
    RightsMinter gateway;
    PlayerRightsMaster master;

    uint256 ownerPk = 0xA11CE;
    uint256 playerPk = 0xB11CE;
    uint256 clubPk = 0xC11CE;
    uint256 attorneyPk = 0xD11CE;

    address owner;
    address player;
    address club;
    address attorney;

    function setUp() public {
        owner = vm.addr(ownerPk);
        player = vm.addr(playerPk);
        club = vm.addr(clubPk);
        attorney = vm.addr(attorneyPk);

        vm.prank(owner);
        gateway = new RightsMinter(owner);

        vm.prank(owner);
        master = new PlayerRightsMaster(owner);

        vm.startPrank(owner);
        gateway.setMasterNftAddress(address(master));
        master.setAuthorizedMinter(address(gateway));
        vm.stopPrank();
    }

    function testOwnerCanSetMasterNftAddress() public {
        vm.prank(owner);
        gateway.setMasterNftAddress(address(master));

        assertEq(gateway.masterNftAddress(), address(master));
    }

    function testExecuteMintWorksWithValidSignatures() public {
        RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
            player: player,
            club: club,
            attorney: attorney,
            tokenURI: "ipfs://signed-docs",
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        bytes32 structHash = keccak256(
    abi.encode(
        gateway.MINT_AGREEMENT_TYPEHASH(),
        agreement.player,
        agreement.club,
        agreement.attorney,
        keccak256(bytes(agreement.tokenURI)),
        agreement.nonce,
        agreement.deadline
    )
);

        bytes32 domainSeparator = keccak256(
    abi.encode(
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("RightsMinter")),
        keccak256(bytes("1")),
        block.chainid,
        address(gateway)
    )
);

        bytes32 digest = keccak256(
    abi.encodePacked("\x19\x01", domainSeparator, structHash)
);


        (uint8 vp, bytes32 rp, bytes32 sp) = vm.sign(playerPk, digest);
        bytes memory playerSig = abi.encodePacked(rp, sp, vp);

        (uint8 vc, bytes32 rc, bytes32 sc) = vm.sign(clubPk, digest);
        bytes memory clubSig = abi.encodePacked(rc, sc, vc);

        (uint8 va, bytes32 ra, bytes32 sa) = vm.sign(attorneyPk, digest);
        bytes memory attorneySig = abi.encodePacked(ra, sa, va);

        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);

        assertEq(master.ownerOf(1), club);
    }

    function testExecuteMintRevertsIfExpired() public {
        RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
            player: player,
            club: club,
            attorney: attorney,
            tokenURI: "ipfs://signed-docs",
            nonce: 0,
            deadline: block.timestamp - 1
        });

        bytes memory fakeSig = hex"1234";

        vm.expectRevert(RightsMinter.SignatureExpired.selector);
        gateway.executeMint(agreement, fakeSig, fakeSig, fakeSig);
    }
    function testExecuteMintRevertsWithInvalidClubSignature() public {
    RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
        player: player,
        club: club,
        attorney: attorney,
        tokenURI: "ipfs://signed-docs",
        nonce: 0,
        deadline: block.timestamp + 1 hours
    });

    bytes32 structHash = keccak256(
        abi.encode(
            gateway.MINT_AGREEMENT_TYPEHASH(),
            agreement.player,
            agreement.club,
            agreement.attorney,
            keccak256(bytes(agreement.tokenURI)),
            agreement.nonce,
            agreement.deadline
        )
    );

    bytes32 domainSeparator = keccak256(
        abi.encode(
            keccak256(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
            ),
            keccak256(bytes("RightsMinter")),
            keccak256(bytes("1")),
            block.chainid,
            address(gateway)
        )
    );

    bytes32 digest = keccak256(
        abi.encodePacked("\x19\x01", domainSeparator, structHash)
    );

    (uint8 vp, bytes32 rp, bytes32 sp) = vm.sign(playerPk, digest);
    bytes memory playerSig = abi.encodePacked(rp, sp, vp);

    // assinatura errada de propósito
    (uint8 vc, bytes32 rc, bytes32 sc) = vm.sign(attorneyPk, digest);
    bytes memory clubSig = abi.encodePacked(rc, sc, vc);

    (uint8 va, bytes32 ra, bytes32 sa) = vm.sign(attorneyPk, digest);
    bytes memory attorneySig = abi.encodePacked(ra, sa, va);

    vm.expectRevert(abi.encodeWithSelector(RightsMinter.InvalidSignature.selector, club));
    gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
    }
}