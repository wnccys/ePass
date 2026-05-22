// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {RightsVault} from "../src/RightsVault.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";

contract RightsVaultTest is Test {
    PlayerRightsMaster masterNft;
    RightsVault vault;

    address admin = address(this);
    address mockGateway = address(0x111); // Bypassing the multi-sig for pure unit testing
    address spvSafe = address(0x222);

    uint256 constant MASTER_TOKEN_ID = 1;
    uint256 constant FRACTIONAL_SUPPLY = 1_000_000 * 10 ** 18; // 1 Million tokens

    function setUp() public {
        // 1. Deploy the NFT and link the mock gateway
        masterNft = new PlayerRightsMaster(admin);
        masterNft.setAuthorizedMinter(mockGateway);

        // 2. Deploy the Vault, linking it to the NFT contract
        vault = new RightsVault(address(masterNft), admin);

        // 3. Mint the Master NFT directly to the SPV (Simulating a successful gateway execution)
        vm.prank(mockGateway);
        masterNft.mintRights(spvSafe, "ipfs://SignedLegalTrust");
    }

    function test_FractionalizeSuccess() public {
        // 1. The SPV MUST approve the Vault to take its Master NFT
        vm.prank(spvSafe);
        masterNft.approve(address(vault), MASTER_TOKEN_ID);

        // 2. Execute the fractionalization as the SPV
        vm.prank(spvSafe);
        vault.fractionalize(MASTER_TOKEN_ID, FRACTIONAL_SUPPLY);

        // --- THE CRITICAL ASSERTIONS ---
        // A. Does the Vault securely hold the NFT?
        assertEq(masterNft.ownerOf(MASTER_TOKEN_ID), address(vault));

        // B. Did the SPV receive the ERC-20 tokens?
        assertEq(vault.balanceOf(spvSafe), FRACTIONAL_SUPPLY);

        // C. Is the Vault locked?
        assertTrue(vault.isFractionalized());
    }

    function test_RevertIf_NotNftOwner() public {
        address attacker = address(0x999);

        vm.startPrank(attacker);
        // The attacker tries to fractionalize an NFT they don't own
        vm.expectRevert(RightsVault.NotNFTOwner.selector);
        vault.fractionalize(MASTER_TOKEN_ID, FRACTIONAL_SUPPLY);
        vm.stopPrank();
    }

    function test_RevertIf_AlreadyFractionalized() public {
        vm.startPrank(spvSafe);
        masterNft.approve(address(vault), MASTER_TOKEN_ID);

        // First deposit works
        vault.fractionalize(MASTER_TOKEN_ID, FRACTIONAL_SUPPLY);

        // ATTACK: Try to dump another NFT in to mint more tokens (Dilution Attack)
        vm.expectRevert(RightsVault.VaultAlreadyInitialized.selector);
        vault.fractionalize(MASTER_TOKEN_ID, FRACTIONAL_SUPPLY);
        vm.stopPrank();
    }
}
