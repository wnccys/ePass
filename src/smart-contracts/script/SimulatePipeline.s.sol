// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {RightsVaultImpl} from "../src/RightsVaultImpl.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract SimulatePipeline is Script {
    uint256 adminPk = 0x101;
    uint256 playerPk = 0x202;
    uint256 clubSpvPk = 0x303;
    uint256 attorneyPk = 0x404;

    address admin = vm.addr(adminPk);
    address player = vm.addr(playerPk);
    address clubSpv = vm.addr(clubSpvPk);
    address attorney = vm.addr(attorneyPk);

    uint256 constant PLAYER_BPS = 3000;
    uint256 constant CLUB_BPS = 6000;
    uint256 constant ATTORNEY_BPS = 1000;

    function run() public {
        console2.log("=== STARTING RWA TOKENIZATION PIPELINE ===");

        vm.startBroadcast(adminPk);

        MockUSDC usdc = new MockUSDC();
        RightsMinter gateway = new RightsMinter(admin);
        PlayerRightsMaster masterNft = new PlayerRightsMaster(admin);

        RightsVaultImpl implementation = new RightsVaultImpl();
        address clone = Clones.clone(address(implementation));
        RightsVaultImpl vault = RightsVaultImpl(clone);

        vault.initialize(
        address(masterNft),
        address(usdc),
        player,
        clubSpv,
        attorney,
        PLAYER_BPS,
        CLUB_BPS,
        ATTORNEY_BPS,
        admin
    );

        gateway.setMasterNftAddress(address(masterNft));
        masterNft.setAuthorizedMinter(address(gateway));
        masterNft.setAuthorizedOperator(address(vault), true);

        vm.stopBroadcast();

        console2.log("1. Architecture Deployed and Linked Securely.");

        RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
            player: player,
            club: clubSpv,
            attorney: attorney,
            tokenURI: "ipfs://QmSignedLegalDocs123",
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

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

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        bytes memory playerSig = sign(playerPk, digest);
        bytes memory clubSig = sign(clubSpvPk, digest);
        bytes memory attorneySig = sign(attorneyPk, digest);

        console2.log("2. Off-chain EIP-712 Signatures Collected.");

        vm.startBroadcast(adminPk);
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
        vm.stopBroadcast();

        uint256 tokenId = 1;

        console2.log("3. Master ERC-721 Minted.");
        console2.log("   Owner of tokenId 1: %s", masterNft.ownerOf(tokenId));

        vm.startBroadcast(clubSpvPk);

        masterNft.approve(address(vault), tokenId);

        uint256 supply = 1_000_000 ether;
        vault.fractionalize(tokenId, supply);

        vm.stopBroadcast();

        console2.log("4. NFT Locked in Vault: %s", masterNft.ownerOf(tokenId));
        console2.log("5. Player balance: %s", vault.balanceOf(player) / 1e18);
        console2.log("6. Club balance: %s", vault.balanceOf(clubSpv) / 1e18);
        console2.log("7. Attorney balance: %s", vault.balanceOf(attorney) / 1e18);
        console2.log("=== PIPELINE COMPLETE ===");
    }

    function sign(uint256 pk, bytes32 digest) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}