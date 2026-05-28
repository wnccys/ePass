// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";

contract PlayerRightsMasterTest is Test {
    PlayerRightsMaster master;

    address owner = address(1);
    address minter = address(2);
    address operator = address(3);
    address recipient = address(4);
    address other = address(5);

    function setUp() public {
        vm.prank(owner);
        master = new PlayerRightsMaster(owner);
    }

    function testOwnerCanSetAuthorizedMinter() public {
        vm.prank(owner);
        master.setAuthorizedMinter(minter);

        assertEq(master.authorizedMinter(), minter);
    }

    function testAuthorizedMinterCanMintRights() public {
        vm.startPrank(owner);
        master.setAuthorizedMinter(minter);
        vm.stopPrank();

        vm.prank(minter);
        uint256 tokenId = master.mintRights(recipient, "ipfs://token-metadata");

        assertEq(tokenId, 1);
        assertEq(master.ownerOf(tokenId), recipient);
        assertEq(master.tokenURI(tokenId), "ipfs://token-metadata");
    }

    function testNonAuthorizedMinterCannotMintRights() public {
        vm.prank(recipient);
        vm.expectRevert(PlayerRightsMaster.CallerNotAuthorized.selector);
        master.mintRights(recipient, "ipfs://token-metadata");
    }

    function testOwnerCanAuthorizeOperator() public {
        vm.prank(owner);
        master.setAuthorizedOperator(operator, true);

        assertTrue(master.authorizedOperators(operator));
    }

    function testTransferRevertsForNonAuthorizedOperator() public {
        vm.startPrank(owner);
        master.setAuthorizedMinter(minter);
        vm.stopPrank();

        vm.prank(minter);
        uint256 tokenId = master.mintRights(recipient, "ipfs://token-metadata");

        vm.prank(recipient);
        vm.expectRevert(PlayerRightsMaster.CallerNotAuthorized.selector);
        master.transferFrom(recipient, other, tokenId);
    }

    function testAuthorizedOperatorCanTransfer() public {
        vm.startPrank(owner);
        master.setAuthorizedMinter(minter);
        master.setAuthorizedOperator(operator, true);
        vm.stopPrank();

        vm.prank(minter);
        uint256 tokenId = master.mintRights(recipient, "ipfs://token-metadata");

        vm.prank(recipient);
        master.approve(operator, tokenId);

        vm.prank(operator);
        master.transferFrom(recipient, other, tokenId);

        assertEq(master.ownerOf(tokenId), other);
    }
}
