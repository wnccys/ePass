// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";

contract PlayerRightsMasterTest is Test {
    PlayerRightsMaster master;

    address owner = address(1);
    address minter = address(2);
    address recipient = address(3);

    function setUp() public {
        vm.prank(owner);
        master = new PlayerRightsMaster(owner);
    }

    function testOwnerCanSetAuthorizedMinter() public {
        vm.prank(owner);
        master.setAuthorizedMinter(minter);

        assertEq(master.authorizedMinter(), minter);
    }

    function testNonOwnerCannotSetAuthorizedMinter() public {
        vm.prank(minter);
        vm.expectRevert();
        master.setAuthorizedMinter(minter);
    }

    function testAuthorizedMinterCanMintRights() public {
        vm.prank(owner);
        master.setAuthorizedMinter(minter);

        vm.prank(minter);
        uint256 tokenId = master.mintRights(recipient, "ipfs://token-metadata");

        assertEq(tokenId, 1);
        assertEq(master.ownerOf(tokenId), recipient);
    }

    function testNonAuthorizedMinterCannotMintRights() public {
        vm.prank(recipient);
        vm.expectRevert(PlayerRightsMaster.CallerNotAuthorized.selector);
        master.mintRights(recipient, "ipfs://token-metadata");
    }
}