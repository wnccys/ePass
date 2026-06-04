// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RightsVaultImpl} from "../src/RightsVaultImpl.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {RightsVaultFactory} from "../src/RightsVaultFactory.sol";

contract RightsVaultImplTest is Test {
    RightsVaultImpl vault;
    PlayerRightsMaster master;
    MockUSDC usdc;
    RightsVaultImpl implementation;
    RightsVaultFactory factory;

    address owner    = address(1);
    address minter   = address(2);
    address operator = address(3);
    address player   = address(4);
    address club     = address(5);
    address attorney = address(6);
    address newClub  = address(7);
    address other    = address(8);

    uint256 constant PLAYER_BPS   = 3000;
    uint256 constant CLUB_BPS     = 6000;
    uint256 constant ATTORNEY_BPS = 1000;

    function setUp() public {
        vm.prank(owner);
        master = new PlayerRightsMaster(owner);
    
        usdc = new MockUSDC();
    
        implementation = new RightsVaultImpl();
    
        vm.prank(owner);
        factory = new RightsVaultFactory(
            address(implementation),
            address(master),
            address(usdc),
            owner
        );
    
        vm.prank(owner);
        address vaultAddr = factory.createVault(
            player,
            club,
            attorney,
            PLAYER_BPS,
            CLUB_BPS,
            ATTORNEY_BPS,
            "Neymar Image Rights",
            "RIMG_NJR"
        );
    
        vault = RightsVaultImpl(vaultAddr);
    
        vm.startPrank(owner);
        master.setAuthorizedMinter(minter);
        master.setAuthorizedOperator(address(vault), true);
        vm.stopPrank();
    
        vm.prank(minter);
        master.mintRights(club, "ipfs://player-rights");
    
        usdc.mint(club, 1_000_000 ether);
    }

    function testTokenNameAndSymbol() public view {
        assertEq(vault.name(), "Neymar Image Rights");
        assertEq(vault.symbol(), "RIMG_NJR");
    }

    function testFractionalizeWorksAndSplitsByBasisPoints() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(club);
        vault.fractionalize(1, 1_000_000 ether);

        assertEq(master.ownerOf(1), address(vault));
        assertEq(vault.lockedTokenId(), 1);
        assertEq(vault.balanceOf(player),   300_000 ether);
        assertEq(vault.balanceOf(club),     600_000 ether);
        assertEq(vault.balanceOf(attorney), 100_000 ether);
    }

    function testOnlyClubCanFractionalize() public {
        vm.prank(club);
        master.approve(address(vault), 1);

        vm.prank(other);
        vm.expectRevert(RightsVaultImpl.NotAuthorized.selector);
        vault.fractionalize(1, 1_000_000 ether);
    }

    function testDepositCautionRequiresFractionalizationFirst() public {
        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vm.expectRevert(RightsVaultImpl.FractionalizationRequired.selector);
        vault.depositCaution(1000 ether);
    }

    function testDepositCautionWorksAfterFractionalization() public {
        _fractionalizeDefault();

        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);

        vm.prank(club);
        vault.depositCaution(1000 ether);

        assertEq(uint256(vault.status()), uint256(RightsVaultImpl.ContractStatus.ACTIVE));
        assertEq(vault.cautionAmount(), 1000 ether);
    }

    function testDepositAndMintSplitsReserves() public {
        _fractionalizeDefault();

        uint256 deposit = 1000 ether;
        vm.prank(club);
        usdc.approve(address(vault), deposit);

        vm.prank(club);
        uint256 minted = vault.depositAndMint(deposit);

        // 50% caução, 50% reserva resgatável
        assertEq(vault.cautionAmount(), 500 ether);
        assertEq(vault.redeemableReserve(), 500 ether);
        assertEq(minted, 500 ether);
        assertEq(uint256(vault.status()), uint256(RightsVaultImpl.ContractStatus.ACTIVE));
    }

    function testRedeemAfterDepositAndMint() public {
        _fractionalizeDefault();

        uint256 deposit = 1000 ether;
        vm.prank(club);
        usdc.approve(address(vault), deposit);
        vm.prank(club);
        vault.depositAndMint(deposit);

        // club tem 600_000 ether das shares do fracionamento + 500 ether do depositAndMint
        uint256 clubShares = vault.balanceOf(club);
        uint256 preview = vault.previewRedeem(clubShares);

        uint256 usdcBefore = usdc.balanceOf(club);

        vm.prank(club);
        uint256 returned = vault.redeem(clubShares);

        assertEq(returned, preview);
        assertEq(usdc.balanceOf(club), usdcBefore + returned);
        assertEq(vault.balanceOf(club), 0);
    }

    function testPlayerCanRescindBeforeHalfTime() public {
        _activateContract();

        uint256 clubBefore   = usdc.balanceOf(club);
        uint256 playerBefore = usdc.balanceOf(player);

        vm.prank(player);
        vault.rescindByPlayer();

        uint256 penalty   = (1000 ether * 6500) / 10000;
        uint256 remainder = 1000 ether - penalty;

        assertEq(uint256(vault.status()), uint256(RightsVaultImpl.ContractStatus.RESCINDED));
        assertEq(usdc.balanceOf(club),   clubBefore   + penalty);
        assertEq(usdc.balanceOf(player), playerBefore + remainder);
    }

    function testClubCanRescindBeforeHalfTime() public {
        _activateContract();

        uint256 clubBefore   = usdc.balanceOf(club);
        uint256 playerBefore = usdc.balanceOf(player);

        vm.prank(club);
        vault.rescindByClub();

        uint256 penalty   = (1000 ether * 6500) / 10000;
        uint256 remainder = 1000 ether - penalty;

        assertEq(uint256(vault.status()), uint256(RightsVaultImpl.ContractStatus.RESCINDED));
        assertEq(usdc.balanceOf(player), playerBefore + penalty);
        assertEq(usdc.balanceOf(club),   clubBefore   + remainder);
    }

    function testRedeemAllowedAfterRescission() public {
        _activateContract();

        vm.prank(player);
        vault.rescindByPlayer();

        // status RESCINDED — redeem deve funcionar para quem tem shares
        // player tem 300_000 ether em shares de fracionamento
        uint256 playerShares = vault.balanceOf(player);
        // redeemableReserve é 0 aqui pois não houve depositAndMint, só depositCaution
        // então previewRedeem retorna 0 — nenhum USDC resgatável
        // isso é o comportamento correto: a caução foi para rescisão, não para o pool
        assertEq(vault.previewRedeem(playerShares), 0);
    }

    function testExpireContractWorks() public {
        _activateContract();

        vm.warp(block.timestamp + 366 days + 1 days);

        uint256 clubBefore = usdc.balanceOf(club);
        vault.expireContract();

        assertEq(uint256(vault.status()), uint256(RightsVaultImpl.ContractStatus.EXPIRED));
        assertEq(usdc.balanceOf(club), clubBefore + 1000 ether);
    }

    function testTransferClubMovesClubBalanceAndUpdatesClub() public {
        _fractionalizeDefault();

        vm.prank(club);
        vault.transferClub(newClub);

        assertEq(vault.club(), newClub);
        assertEq(vault.balanceOf(club),    0);
        assertEq(vault.balanceOf(newClub), 600_000 ether);
    }

    function testTimeRemainingReturnsZeroWhenInactive() public view {
        assertEq(vault.timeRemaining(), 0);
    }

    function testIsBeforeHalfTimeReturnsFalseWhenInactive() public view {
        assertEq(vault.isBeforeHalfTime(), false);
    }

    function testDepositCautionRevertsWhenAmountIsZero() public {
        _fractionalizeDefault();

        vm.prank(club);
        vm.expectRevert(RightsVaultImpl.WrongCautionAmount.selector);
        vault.depositCaution(0);
    }

    function testFractionalizeRevertsWhenClubIsNotTokenOwner() public {
        vm.prank(minter);
        master.mintRights(other, "ipfs://other-player-rights");

        vm.prank(club);
        vm.expectRevert(RightsVaultImpl.NotNFTOwner.selector);
        vault.fractionalize(2, 1_000_000 ether);
    }

    function testCanRedeemReturnsTrueWhenActive() public {
        _activateContract();
        assertTrue(vault.canRedeem());
    }

    function testGetFinancialState() public {
        _fractionalizeDefault();

        vm.prank(club);
        usdc.approve(address(vault), 1000 ether);
        vm.prank(club);
        vault.depositAndMint(1000 ether);

        (
            uint256 caution,
            uint256 redeemable,
            uint256 supply,
            uint256 clubBal,
            RightsVaultImpl.ContractStatus st
        ) = vault.getFinancialState();

        assertEq(caution,    500 ether);
        assertEq(redeemable, 500 ether);
        assertEq(supply,     1_000_000 ether + 500 ether);
        assertEq(clubBal,    600_000 ether + 500 ether);
        assertEq(uint256(st), uint256(RightsVaultImpl.ContractStatus.ACTIVE));
    }

    // ─── helpers ────────────────────────────────────────────────────────────

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