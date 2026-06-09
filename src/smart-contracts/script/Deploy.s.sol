// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {RightsMinter} from "../src/RightsMinter.sol";
import {PlayerRightsMaster} from "../src/PlayerRightsMaster.sol";
import {RightsVaultImpl} from "../src/RightsVaultImpl.sol";
import {RightsVaultFactory} from "../src/RightsVaultFactory.sol";

contract Deploy is Script {
    function run() public {
        // #1 account in Foundry
        uint256 deployerPk = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPk);

        vm.startBroadcast(deployerPk);

        MockUSDC usdc = new MockUSDC();
        RightsMinter minter = new RightsMinter(deployer);
        PlayerRightsMaster nft = new PlayerRightsMaster(deployer);
        RightsVaultImpl implementation = new RightsVaultImpl();

        RightsVaultFactory factory = new RightsVaultFactory(
            address(implementation),
            address(nft),
            address(usdc),
            deployer
        );

        minter.setMasterNftAddress(address(nft));
        nft.setAuthorizedMinter(address(minter));

        vm.stopBroadcast();

        console2.log("=== Deployment Output ===");
        console2.log("NEXT_PUBLIC_MOCK_USDC_ADDRESS=%s", address(usdc));
        console2.log("NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS=%s", address(minter));
        console2.log(
            "NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS=%s",
            address(nft)
        );
        console2.log(
            "NEXT_PUBLIC_RIGHTS_VAULT_IMPLEMENTATION_ADDRESS=%s",
            address(implementation)
        );
        console2.log("NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=%s", address(factory));
        console2.log("=========================");
    }
}
