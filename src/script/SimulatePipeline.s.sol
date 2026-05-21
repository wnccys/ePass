// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {RightsVault} from "../src/RightsVault.sol";

contract SimulatePipeline is Script {
    // 1. Setup the Actors (Private Keys)
    uint256 adminPk = 0x101;
    uint256 playerPk = 0x202;
    uint256 clubSpvPk = 0x303;
    uint256 attorneyPk = 0x404;

    address admin = vm.addr(adminPk);
    address player = vm.addr(playerPk);
    address clubSpv = vm.addr(clubSpvPk);
    address attorney = vm.addr(attorneyPk);

    function run() public {
        console2.log("=== STARTING RWA TOKENIZATION PIPELINE ===");

        /* -------------------------------------------------------------------------- */
        /* PHASE 1: DEPLOYMENT & LINKING (Admin)                                      */
        /* -------------------------------------------------------------------------- */
        vm.startBroadcast(adminPk);

        RightsMinter gateway = new RightsMinter(admin);
        PlayerRightsMaster masterNft = new PlayerRightsMaster(admin);
        RightsVault vault = new RightsVault(address(masterNft), admin);

        // Link the architecture
        gateway.setMasterNftAddress(address(masterNft));
        masterNft.setAuthorizedMinter(address(gateway));

        vm.stopBroadcast();
        console2.log("1. Architecture Deployed and Linked Securely.");

        /* -------------------------------------------------------------------------- */
        /* PHASE 2: OFF-CHAIN SIGNATURES (The Meatspace Agreement)                    */
        /* -------------------------------------------------------------------------- */
        // Create the agreement payload
        RightsMinter.MintAgreement memory agreement = RightsMinter
            .MintAgreement({
                player: player,
                club: clubSpv,
                attorney: attorney,
                tokenURI: "ipfs://QmSignedLegalDocs123",
                nonce: 0,
                deadline: block.timestamp + 1 hours
            });

        // Reconstruct EIP-712 Digest
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
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        // Actors sign using their private wallets (MetaMask simulation)
        bytes memory playerSig = _sign(playerPk, digest);
        bytes memory clubSig = _sign(clubSpvPk, digest);
        bytes memory attorneySig = _sign(attorneyPk, digest);
        console2.log("2. Off-chain EIP-712 Signatures Collected.");

        /* -------------------------------------------------------------------------- */
        /* PHASE 3: ON-CHAIN EXECUTION (Minting the Master NFT)                       */
        /* -------------------------------------------------------------------------- */
        // Anyone can broadcast this, but we'll use the Admin as a relayer
        vm.startBroadcast(adminPk);
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
        vm.stopBroadcast();

        uint256 tokenId = 1;
        console2.log(
            "3. Master ERC-721 Minted to SPV (checks if club is owner of tokenId):",
            masterNft.ownerOf(tokenId) == clubSpv
        );

        /* -------------------------------------------------------------------------- */
        /* PHASE 4: DEFI FRACTIONALIZATION (Locking in the Vault)                     */
        /* -------------------------------------------------------------------------- */
        vm.startBroadcast(clubSpvPk); // The SPV executes this

        // Approve the vault
        masterNft.approve(address(vault), tokenId);

        // Deposit NFT and mint 1 Million $P_IMAGE tokens
        uint256 supply = 1_000_000 * 10 ** 18;
        vault.fractionalize(tokenId, supply);

        vm.stopBroadcast();

        console2.log(
            "4. NFT Locked in Vault:",
            masterNft.ownerOf(tokenId) == address(vault)
        );
        console2.log(
            "5. SPV $P_IMAGE ERC-20 Balance:",
            vault.balanceOf(clubSpv) / 10 ** 18
        );
        console2.log("=== PIPELINE COMPLETE ===");
    }

    // Helper to pack ECDSA signatures
    function _sign(
        uint256 pk,
        bytes32 digest
    ) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}
