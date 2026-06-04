// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {RightsVaultImpl} from "../src/RightsVaultImpl.sol";
import {RightsVaultFactory} from "../src/RightsVaultFactory.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract SimulatePipeline is Script {
    uint256 adminPk    = 0x101;
    uint256 playerPk   = 0x202;
    uint256 clubSpvPk  = 0x303;
    uint256 attorneyPk = 0x404;

    address admin    = vm.addr(adminPk);
    address player   = vm.addr(playerPk);
    address clubSpv  = vm.addr(clubSpvPk);
    address attorney = vm.addr(attorneyPk);

    uint256 constant PLAYER_BPS   = 3000;
    uint256 constant CLUB_BPS     = 6000;
    uint256 constant ATTORNEY_BPS = 1000;

    function run() public {
        console2.log("=== STARTING RWA TOKENIZATION PIPELINE ===");

        /* ------------------------------------------------------------------ */
        /* PHASE 1: DEPLOYMENT & LINKING                                       */
        /* ------------------------------------------------------------------ */
        vm.startBroadcast(adminPk);

        MockUSDC usdc           = new MockUSDC();
        RightsMinter gateway    = new RightsMinter(admin);
        PlayerRightsMaster masterNft = new PlayerRightsMaster(admin);

        // Deploy da implementação (sem parâmetros — _disableInitializers no ctor)
        RightsVaultImpl impl = new RightsVaultImpl();

        // Factory aponta para a implementação
        RightsVaultFactory factory = new RightsVaultFactory(
            address(impl),
            address(masterNft),
            address(usdc),
            admin
        );

        gateway.setMasterNftAddress(address(masterNft));
        masterNft.setAuthorizedMinter(address(gateway));

        vm.stopBroadcast();
        console2.log("1. Architecture Deployed and Linked.");

        /* ------------------------------------------------------------------ */
        /* PHASE 2: OFF-CHAIN SIGNATURES                                       */
        /* ------------------------------------------------------------------ */
        RightsMinter.MintAgreement memory agreement = RightsMinter.MintAgreement({
            player:   player,
            club:     clubSpv,
            attorney: attorney,
            tokenURI: "ipfs://QmSignedLegalDocs123",
            nonce:    0,
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

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        bytes memory playerSig   = _sign(playerPk,   digest);
        bytes memory clubSig     = _sign(clubSpvPk,  digest);
        bytes memory attorneySig = _sign(attorneyPk, digest);
        console2.log("2. EIP-712 Signatures Collected.");

        /* ------------------------------------------------------------------ */
        /* PHASE 3: MINT DO NFT MESTRE                                         */
        /* ------------------------------------------------------------------ */
        vm.startBroadcast(adminPk);
        gateway.executeMint(agreement, playerSig, clubSig, attorneySig);
        vm.stopBroadcast();

        uint256 tokenId = 1;
        console2.log(
            "3. Master NFT Minted to club:",
            masterNft.ownerOf(tokenId) == clubSpv
        );

        /* ------------------------------------------------------------------ */
        /* PHASE 4: CRIAÇÃO DO VAULT VIA FACTORY                              */
        /* ------------------------------------------------------------------ */
        vm.startBroadcast(adminPk);

        // Autoriza o vault a ser operador do NFT antes de criar
        // (o endereço do vault só existe após createVault, então autorizamos depois)
        address vaultAddr = factory.createVault(
            player,
            clubSpv,
            attorney,
            PLAYER_BPS,
            CLUB_BPS,
            ATTORNEY_BPS,
            "Neymar Image Rights",
            "RIMG_NJR"
        );

        masterNft.setAuthorizedOperator(vaultAddr, true);

        vm.stopBroadcast();
        console2.log("4. Vault clone created at:", vaultAddr);

        /* ------------------------------------------------------------------ */
        /* PHASE 5: FRACIONAMENTO                                              */
        /* ------------------------------------------------------------------ */
        RightsVaultImpl vault = RightsVaultImpl(vaultAddr);

        vm.startBroadcast(clubSpvPk);

        masterNft.approve(vaultAddr, tokenId);

        uint256 supply = 1_000_000 * 10 ** 18;
        vault.fractionalize(tokenId, supply);

        vm.stopBroadcast();

        console2.log(
            "5. NFT locked in vault:",
            masterNft.ownerOf(tokenId) == vaultAddr
        );
        console2.log(
            "6. Club RIMG_NJR balance:",
            vault.balanceOf(clubSpv) / 10 ** 18
        );

        /* ------------------------------------------------------------------ */
        /* PHASE 6: DEPOSITO E ATIVAÇÃO DO CONTRATO                           */
        /* ------------------------------------------------------------------ */

        // Admin minta USDC para o clube poder depositar caução
        vm.startBroadcast(adminPk);
        usdc.mint(clubSpv, 10_000 ether);
        vm.stopBroadcast();

        vm.startBroadcast(clubSpvPk);
        usdc.approve(vaultAddr, 10_000 ether);
        vault.depositAndMint(10_000 ether);
        vm.stopBroadcast();

        console2.log(
            "7. Contract ACTIVE. Caution (USDC):",
            vault.cautionAmount() / 10 ** 18
        );
        console2.log(
            "8. Redeemable reserve (USDC):",
            vault.redeemableReserve() / 10 ** 18
        );
        console2.log("=== PIPELINE COMPLETE ===");
    }

    function _sign(uint256 pk, bytes32 digest_) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest_);
        return abi.encodePacked(r, s, v);
    }
}