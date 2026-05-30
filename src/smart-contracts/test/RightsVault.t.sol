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
    address minter = address(2);
    address operator = address(3);
    address player = address(4);
    address club = address(5);
    address attorney = address(6);
    address newClub = address(7);
    address other = address(8);

    uint256 constant PLAYER_BPS = 3000;
    uint256 constant CLUB_BPS = 6000;
    uint256 constant ATTORNEY_BPS = 1000;

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
            attorney,
            PLAYER_BPS,
            CLUB_BPS,
            ATTORNEY_BPS,
            owner
        );

        vm.startPrank(owner);
        master.setAuthorizedMinter(minter);
        master.setAuthorizedOperator(address(vault), true);
        vm.stopPrank();

        vm.prank(minter);
        master.mintRights(club, "ipfs://player-rights");

        usdc.mint(club, 1_000_000 ether);
    }

    function testFractionalizeWorksAndSplitsByBasisPoints() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(club);
        vault.fractionalize(1, 1_000_000 ether);

        assertEq(master.ownerOf(1), address(vault));
        assertEq(vault.lockedTokenId(), 1);
        assertEq(vault.balanceOf(player), 300_000 ether);
        assertEq(vault.balanceOf(club), 600_000 ether);
        assertEq(vault.balanceOf(attorney), 100_000 ether);
    }

    function testOnlyClubCanFractionalize() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(other);
        vm.expectRevert(RightsVault.NotAuthorized.selector);
        vault.fractionalize(1, 1_000_000 ether);
    }

    function testDepositCautionRequiresFractionalizationFirst() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vm.expectRevert(RightsVault.FractionalizationRequired.selector);
        vault.depositCaution(1000 ether);
    }

    function testDepositCautionWorksAfterFractionalization() public {
        _fractionalizeDefault();

        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.ACTIVE));
        assertEq(vault.cautionAmount(), 1000 ether);
    }

    function testPlayerCanRescindBeforeHalfTime() public {
        _activateContract();

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
        _activateContract();

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
        _activateContract();

        vm.warp(block.timestamp + 366 days + 1 days);

        uint256 clubBefore = usdc.balanceOf(club);
        vault.expireContract();

        assertEq(uint256(vault.status()), uint256(RightsVault.ContractStatus.EXPIRED));
        assertEq(usdc.balanceOf(club), clubBefore + 1000 ether);
    }

    function testTransferClubMovesClubBalanceAndUpdatesClub() public {
        _fractionalizeDefault();

        vm.prank(club);
        vault.transferClub(newClub);

        assertEq(vault.club(), newClub);
        assertEq(vault.balanceOf(club), 0);
        assertEq(vault.balanceOf(newClub), 600_000 ether);
    }

    function testTimeRemainingReturnsZeroWhenInactive() public {
        assertEq(vault.timeRemaining(), 0);
    }

    function testIsBeforeHalfTimeReturnsFalseWhenInactive() public {
        assertEq(vault.isBeforeHalfTime(), false);
    }

    function testDepositCautionRevertsWhenAmountIsZero() public {
        _fractionalizeDefault();

        vm.prank(club);
        vm.expectRevert(RightsVault.WrongCautionAmount.selector);
        vault.depositCaution(0);
    }

    function testFractionalizeRevertsWhenClubIsNotTokenOwner() public {
        vm.prank(minter);
        master.mintRights(other, "ipfs://other-player-rights");

        vm.prank(club);
        vm.expectRevert(RightsVault.NotNFTOwner.selector);
        vault.fractionalize(2, 1_000_000 ether);
    }

    function _fractionalizeDefault() internal {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(club);
        vault.fractionalize(1, 1_000_000 ether);
    }

    function _activateContract() internal {
        _fractionalizeDefault();

        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);
    }
}
