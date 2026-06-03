// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
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
        RightsMinter.MintAgreement memory agreement = _buildAgreement(0, block.timestamp + 1 hours);
        (bytes memory playerSig, bytes memory clubSig, bytes memory attorneySig) = _signAgreement(agreement);

        uint256 tokenId = gateway.executeMint(agreement, playerSig, clubSig, attorneySig);

        assertEq(tokenId, 1);
        assertEq(master.ownerOf(tokenId), club);
        assertEq(master.tokenURI(tokenId), agreement.tokenURI);
    }

    function testExecuteMintRevertsIfExpired() public {
        RightsMinter.MintAgreement memory agreement = _buildAgreement(0, block.timestamp - 1);
        bytes memory fakeSig = hex"1234";

        vm.expectRevert(RightsMinter.SignatureExpired.selector);
        gateway.executeMint(agreement, fakeSig, fakeSig, fakeSig);
    }

    function testExecuteMintRevertsWithInvalidClubSignature() public {
        RightsMinter.MintAgreement memory agreement = _buildAgreement(0, block.timestamp + 1 hours);
        bytes32 digest = _digestFor(agreement);

        bytes memory playerSig = _signDigest(playerPk, digest);
        bytes memory clubSig = _signDigest(attorneyPk, digest);
        bytes memory attorneySig = _signDigest(attorneyPk, digest);

        vm.expectRevert(abi.encodeWithSelector(RightsMinter.InvalidSignature.selector, club));
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
    }

    function testExecuteMintRevertsIfMasterNotConfigured() public {
        vm.prank(owner);
        RightsMinter freshGateway = new RightsMinter(owner);

        RightsMinter.MintAgreement memory agreement = _buildAgreement(0, block.timestamp + 1 hours);
        (bytes memory playerSig, bytes memory clubSig, bytes memory attorneySig) = _signAgreementFor(freshGateway, agreement);

        vm.expectRevert(RightsMinter.MasterNotConfigured.selector);
        freshGateway.executeMint(agreement, playerSig, clubSig, attorneySig);
    }

    function testExecuteMintRevertsOnReplayNonce() public {
        RightsMinter.MintAgreement memory agreement = _buildAgreement(0, block.timestamp + 1 hours);
        (bytes memory playerSig, bytes memory clubSig, bytes memory attorneySig) = _signAgreement(agreement);

        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);

        vm.expectRevert(RightsMinter.AgreementAlreadyExecuted.selector);
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
    }

    function _buildAgreement(uint256 nonce, uint256 deadline)
        internal
        view
        returns (RightsMinter.MintAgreement memory)
    {
        return RightsMinter.MintAgreement({
            player: player,
            club: club,
            attorney: attorney,
            tokenURI: "ipfs://signed-docs",
            nonce: nonce,
            deadline: deadline
        });
    }

    function _signAgreement(RightsMinter.MintAgreement memory agreement)
        internal
        view
        returns (bytes memory playerSig, bytes memory clubSig, bytes memory attorneySig)
    {
        return _signAgreementFor(gateway, agreement);
    }

    function _signAgreementFor(RightsMinter target, RightsMinter.MintAgreement memory agreement)
        internal
        view
        returns (bytes memory playerSig, bytes memory clubSig, bytes memory attorneySig)
    {
        bytes32 digest = _digestFor(target, agreement);
        playerSig = _signDigest(playerPk, digest);
        clubSig = _signDigest(clubPk, digest);
        attorneySig = _signDigest(attorneyPk, digest);
    }

    function _digestFor(RightsMinter.MintAgreement memory agreement) internal view returns (bytes32) {
        return _digestFor(gateway, agreement);
    }

    function _digestFor(RightsMinter target, RightsMinter.MintAgreement memory agreement)
        internal
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(
                target.MINT_AGREEMENT_TYPEHASH(),
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
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("RightsMinter")),
                keccak256(bytes("1")),
                block.chainid,
                address(target)
            )
        );

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _signDigest(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}
