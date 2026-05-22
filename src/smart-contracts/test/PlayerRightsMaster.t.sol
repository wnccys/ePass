// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract PlayerRightsMasterTest is Test {
    PlayerRightsMaster masterNft;

    // Define test actors
    address admin = address(this); // The test contract acts as the protocol admin
    address mockGateway = address(0x111); // Mocking the RightsMinter multi-sig contract
    address spvSafe = address(0x222); // The legal entity receiving the NFT
    address attacker = address(0x999); // Malicious actor

    function setUp() public {
        // Deploy the Master NFT, assigning the admin role to this test contract
        masterNft = new PlayerRightsMaster(admin);
    }

    /* -------------------------------------------------------------------------- */
    /* ADMIN CONFIGURATION                                                        */
    /* -------------------------------------------------------------------------- */

    function test_SetAuthorizedMinterSuccess() public {
        // Admin sets the gateway
        masterNft.setAuthorizedMinter(mockGateway);

        // Verify state changed
        assertEq(masterNft.authorizedMinter(), mockGateway);
    }

    function test_RevertIf_NonAdminTriesToSetMinter() public {
        // Prank changes msg.sender for the next call to be the attacker
        vm.prank(attacker);

        // Expect standard OpenZeppelin Ownable revert
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                attacker
            )
        );
        masterNft.setAuthorizedMinter(attacker);
    }

    /* -------------------------------------------------------------------------- */
    /* MINTING LOGIC                                                              */
    /* -------------------------------------------------------------------------- */

    function test_MintRightsSuccess() public {
        // 1. Setup: Admin links the gateway
        masterNft.setAuthorizedMinter(mockGateway);

        // 2. Action: The gateway (and ONLY the gateway) calls mint
        vm.prank(mockGateway);

        // We expect the custom event to fire
        vm.expectEmit(true, true, false, true);
        emit PlayerRightsMaster.RightsMinted(
            1,
            spvSafe,
            "ipfs://SignedLegalTrust"
        );

        uint256 tokenId = masterNft.mintRights(
            spvSafe,
            "ipfs://SignedLegalTrust"
        );

        // 3. Assertions
        assertEq(tokenId, 1, "Token ID should be 1");
        assertEq(masterNft.ownerOf(1), spvSafe, "SPV Safe should own the NFT");
        assertEq(
            masterNft.tokenURI(1),
            "ipfs://SignedLegalTrust",
            "URI must match the legal document"
        );
    }

    function test_RevertIf_UnauthorizedCallerMints() public {
        // Setup: Admin links the gateway
        masterNft.setAuthorizedMinter(mockGateway);

        // ATTACK 1: Random person tries to mint
        vm.prank(attacker);
        vm.expectRevert(PlayerRightsMaster.CallerNotAuthorized.selector);
        masterNft.mintRights(attacker, "ipfs://FakeDocs");

        // ATTACK 2: Even the protocol admin/owner cannot bypass the multi-sig to mint!
        vm.prank(admin);
        vm.expectRevert(PlayerRightsMaster.CallerNotAuthorized.selector);
        masterNft.mintRights(admin, "ipfs://FakeDocs");
    }
}
