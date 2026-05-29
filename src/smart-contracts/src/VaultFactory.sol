// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RightsVault} from "./RightsVault.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VaultFactory is Ownable {
    mapping(address => address[]) public clubVaults;
    address[] public allVaults;

    event VaultCreated(address indexed vault, address indexed player, address indexed club);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Implanta uma nova instância de RightsVault.
    /// @param _masterNftAddress Endereço do contrato PlayerRightsMaster (ERC-721).
    /// @param _stablecoinAddress Endereço do contrato da stablecoin (ERC-20) usada para caução.
    /// @param _player Endereço do jogador.
    /// @param _club Endereço do clube (normalmente o msg.sender, mas pode ser especificado).
    /// @return vault O endereço do novo contrato RightsVault.
    function createVault(
        address _masterNftAddress,
        address _stablecoinAddress,
        address _player,
        address _club
    ) external returns (address vault) {
        RightsVault newVault = new RightsVault(
            _masterNftAddress,
            _stablecoinAddress,
            _player,
            _club,
            msg.sender // O criador inicial do vault (owner)
        );

        vault = address(newVault);

        allVaults.push(vault);
        clubVaults[_club].push(vault);

        emit VaultCreated(vault, _player, _club);
    }

    /// @notice Retorna todos os cofres criados pela factory.
    function getVaults() external view returns (address[] memory) {
        return allVaults;
    }

    /// @notice Retorna os cofres associados a um clube específico.
    function getVaultsByClub(address club) external view returns (address[] memory) {
        return clubVaults[club];
    }
}
