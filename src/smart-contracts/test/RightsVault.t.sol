// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RightsVault} from "../src/RightsVault.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract RightsVaultTest is Test {
    RightsVault vault;
    PlayerRightsMaster master;
    MockUSDC usdc;

    address owner = address(1);
    address player = address(2);
    address club = address(3);
    address other = address(4);

    function setUp() public {
        vm.prank(owner);
        master = new PlayerRightsMaster(owner);

        usdc = new MockUSDC();

        vm.prank(owner);
        vault = new RightsVault(
            address(master),
            address(usdc),
            player,
            club,
            owner
        );

        vm.prank(owner);
        master.setAuthorizedMinter(owner);

        vm.prank(owner);
        master.mintRights(club, "ipfs://player-rights");

        usdc.mint(club, 1_000_000 ether);
    }

    function testFractionalizeWorks() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(club);
        vault.fractionalize(1, 1_000_000 ether);

        assertEq(master.ownerOf(1), address(vault));
        assertEq(vault.balanceOf(club), 1_000_000 ether);
        assertEq(vault.lockedTokenId(), 1);
    }

    function testOnlyClubCanFractionalize() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(other);
        vm.expectRevert(RightsVault.NotAuthorized.selector);
        vault.fractionalize(1, 1_000_000 ether);
    }

    function testDepositCautionWorks() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.ACTIVE));
        assertEq(vault.cautionAmount(), 1000 ether);
    }

    function testOnlyClubCanDepositCaution() public {
        vm.prank(other);
        vm.expectRevert(RightsVault.NotAuthorized.selector);
        vault.depositCaution(1000 ether);
    }

    function testPlayerCanRescindBeforeHalfTime() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        uint256 clubBefore = usdc.balanceOf(club);
        uint256 playerBefore = usdc.balanceOf(player);

        vm.prank(player);
        vault.rescindByPlayer();

        uint256 penalty = (1000 ether * 6500) / 10000;
        uint256 remainder = 1000 ether - penalty;

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.RESCINDED));
        assertEq(usdc.balanceOf(club), clubBefore + penalty);
        assertEq(usdc.balanceOf(player), playerBefore + remainder);
    }

    function testClubCanRescindBeforeHalfTime() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        uint256 clubBefore = usdc.balanceOf(club);
        uint256 playerBefore = usdc.balanceOf(player);

        vm.prank(club);
        vault.rescindByClub();

        uint256 penalty = (1000 ether * 6500) / 10000;
        uint256 remainder = 1000 ether - penalty;

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.RESCINDED));
        assertEq(usdc.balanceOf(player), playerBefore + penalty);
        assertEq(usdc.balanceOf(club), clubBefore + remainder);
    }

    function testExpireContractWorks() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        vm.warp(block.timestamp + 366 days + 1 days);

        uint256 clubBefore = usdc.balanceOf(club);

        vault.expireContract();

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.EXPIRED));
        assertEq(usdc.balanceOf(club), clubBefore + 1000 ether);
    }

    function testTimeRemainingReturnsZeroWhenInactive() public {
        assertEq(vault.timeRemaining(), 0);
    }

    function testIsBeforeHalfTimeReturnsFalseWhenInactive() public {
        assertEq(vault.isBeforeHalfTime(), false);
    }
    function testDepositCautionRevertsWhenAmountIsZero() public {
    vm.prank(club);
    vm.expectRevert(RightsVault.WrongCautionAmount.selector);
    vault.depositCaution(0);
    }
    
    function testFractionalizeRevertsWhenClubIsNotTokenOwner() public {
    vm.prank(owner);
    master.mintRights(other, "ipfs://other-player-rights");

    vm.prank(club);
    vm.expectRevert(RightsVault.NotNFTOwner.selector);
    vault.fractionalize(2, 1_000_000 ether);
    }
}