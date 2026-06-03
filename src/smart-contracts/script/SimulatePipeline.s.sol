// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {RightsVaultImpl} from "../src/RightsVaultImpl.sol";
import {RightsVaultFactory} from "../src/RightsVaultFactory.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract SimulatePipeline is Script {
    uint256 adminPk = 0x101;
    uint256 playerPk = 0x202;
    uint256 clubSpvPk = 0x303;
    uint256 attorneyPk = 0x404;

    address admin = vm.addr(adminPk);
    address player = vm.addr(playerPk);
    address clubSpv = vm.addr(clubSpvPk);
    address attorney = vm.addr(attorneyPk);

    uint256 constant PLAYER_BPS = 3000; // 30%
    uint256 constant CLUB_BPS = 6000;   // 60%
    uint256 constant ATTORNEY_BPS = 1000; // 10%

    function run() public {
        console2.log("=== STARTING COMPLETE RWA TOKENIZATION PIPELINE ===");

        vm.startBroadcast(adminPk);

        MockUSDC usdc = new MockUSDC();
        RightsMinter gateway = new RightsMinter(admin);
        PlayerRightsMaster masterNft = new PlayerRightsMaster(admin);
        RightsVaultImpl implementation = new RightsVaultImpl();

        // Deploy the Factory
        RightsVaultFactory factory = new RightsVaultFactory(
            address(implementation),
            address(masterNft),
            address(usdc),
            admin
        );

        gateway.setMasterNftAddress(address(masterNft));
        masterNft.setAuthorizedMinter(address(gateway));

        vm.stopBroadcast();

        console2.log("1. Infrastructure Deployed and Factory Configured.");

        // Mint NFT via RightsMinter Gateway using Nullifiers
        RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
            player: player,
            club: clubSpv,
            attorney: attorney,
            tokenURI: "ipfs://QmSignedLegalDocs123",
            nonce: 123456789, // Random salt nonce
            deadline: block.timestamp + 1 hours
        });

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("RightsMinter")),
                keccak256(bytes("1")),
                block.chainid,
                address(gateway)
            )
        );

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

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        bytes memory playerSig = sign(playerPk, digest);
        bytes memory clubSig = sign(clubSpvPk, digest);
        bytes memory attorneySig = sign(attorneyPk, digest);

        console2.log("2. EIP-712 Signatures Generated.");

        vm.startBroadcast(adminPk);
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
        vm.stopBroadcast();

        uint256 tokenId = 1;
        console2.log("3. NFT Minted using Gateway. TokenId 1 Owner: %s", masterNft.ownerOf(tokenId));

        // Deploy Vault Proxy Clone via Factory
        vm.startBroadcast(clubSpvPk);
        address clone = factory.createVault(player, clubSpv, attorney, PLAYER_BPS, CLUB_BPS, ATTORNEY_BPS);
        RightsVaultImpl vault = RightsVaultImpl(clone);
        vm.stopBroadcast();

        console2.log("4. Vault Proxy Clone Deployed via Factory at Address: %s", clone);

        // Authorize Vault Clone on PlayerRightsMaster
        vm.startBroadcast(adminPk);
        masterNft.setAuthorizedOperator(clone, true);
        vm.stopBroadcast();
        console2.log("5. Vault Clone Authorized on PlayerRightsMaster.");

        // Approve NFT to Vault
        vm.startBroadcast(clubSpvPk);
        masterNft.approve(address(vault), tokenId);
        console2.log("6. NFT Approved to Vault.");

        // Fractionalize NFT
        uint256 supply = 1_000_000 ether;
        vault.fractionalize(tokenId, supply);
        vm.stopBroadcast();

        console2.log("7. NFT Fractionalized. Supply of 1M $P_IMAGE tokens minted.");
        console2.log("   - Player Shares: %s", vault.balanceOf(player) / 1e18);
        console2.log("   - Club Shares: %s", vault.balanceOf(clubSpv) / 1e18);
        console2.log("   - Attorney Shares: %s", vault.balanceOf(attorney) / 1e18);

        // Caution Deposit Lifecycle Simulation
        uint256 caution = 1000 * 10**18; // 1000 USDC
        
        // Faucet: Mint MockUSDC to Club
        vm.startBroadcast(adminPk);
        usdc.mint(clubSpv, caution);
        vm.stopBroadcast();
        console2.log("8. Club Faucet: Minted 1000 Mock USDC to Club. Club Balance: %s USDC", usdc.balanceOf(clubSpv) / 1e18);

        // Club Approves USDC and Deposits Caution
        vm.startBroadcast(clubSpvPk);
        usdc.approve(address(vault), caution);
        vault.depositCaution(caution);
        vm.stopBroadcast();

        console2.log("9. Caution Deposited & Vault Status is ACTIVE.");
        console2.log("   - Vault Escrow Balance: %s USDC", usdc.balanceOf(address(vault)) / 1e18);
        console2.log("   - Vault Status (0:Pending, 1:Active): %s", uint256(vault.status()));

        // Rescission Scenario Simulation (Player Rescinds Before Half Time)
        console2.log("10. Simulating Early Rescission by Player...");
        vm.startBroadcast(playerPk);
        vault.rescindByPlayer();
        vm.stopBroadcast();

        console2.log("11. Rescission Executed. Checking Penalty Splits (65% Club, 35% Player):");
        console2.log("    - Club USDC Balance (Expected 650): %s USDC", usdc.balanceOf(clubSpv) / 1e18);
        console2.log("    - Player USDC Balance (Expected 350): %s USDC", usdc.balanceOf(player) / 1e18);
        console2.log("    - Vault Escrow Balance (Expected 0): %s USDC", usdc.balanceOf(address(vault)) / 1e18);
        console2.log("    - Vault Status (2:Rescinded): %s", uint256(vault.status()));

        console2.log("=== COMPREHENSIVE RWA PIPELINE SIMULATION COMPLETE ===");
    }

    function sign(uint256 pk, bytes32 digest) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}
