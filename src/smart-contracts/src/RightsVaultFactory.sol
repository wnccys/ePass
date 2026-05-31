// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RightsVaultImpl} from "./RightsVaultImpl.sol";

/// @title RightsVaultFactory
/// @notice Factory responsável por criar novos vaults de direito de imagem via EIP-1167 minimal proxy.
/// @dev Cada chamada a createVault() gera um clone de ~45 bytes que delega toda lógica
///      para o RightsVaultImpl, mas possui seu próprio storage (player, club, caução etc).
///
///      Fluxo:
///        1. Deploy RightsVaultImpl (implementação — uma única vez)
///        2. Deploy RightsVaultFactory apontando para a implementação
///        3. Para cada novo contrato de imagem: chamar factory.createVault(...)
///        4. O clone retornado é o vault daquele contrato específico
contract RightsVaultFactory is Ownable {
    using Clones for address;

    // ─────────────────────────────────────────────────────────
    // ESTADO DA FACTORY
    // ─────────────────────────────────────────────────────────

    /// @notice Endereço do contrato de implementação que todos os clones apontam.
    address public immutable implementation;

    /// @notice Endereço do PlayerRightsMaster — compartilhado por todos os vaults.
    address public masterNftAddress;

    /// @notice Endereço da stablecoin de caução — compartilhado por todos os vaults.
    address public stablecoinAddress;

    /// @notice Lista de todos os vaults criados pela factory.
    address[] private _allVaults;

    /// @notice Mapeamento clube → lista de vaults do clube.
    mapping(address => address[]) private _vaultsByClub;

    /// @notice Mapeamento jogador → lista de vaults do jogador.
    mapping(address => address[]) private _vaultsByPlayer;

    // ─────────────────────────────────────────────────────────
    // EVENTOS
    // ─────────────────────────────────────────────────────────

    event VaultCreated(
        address indexed vault,
        address indexed player,
        address indexed club,
        address attorney,
        uint256 playerBps,
        uint256 clubBps,
        uint256 attorneyBps
    );

    event MasterNftAddressUpdated(address indexed newAddress);
    event StablecoinAddressUpdated(address indexed newAddress);

    // ─────────────────────────────────────────────────────────
    // ERROS
    // ─────────────────────────────────────────────────────────

    error ZeroAddress();
    error InvalidBasisPoints();

    // ─────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────

    /// @param _implementation   Endereço do RightsVaultImpl já deployado
    /// @param _masterNftAddress Endereço do PlayerRightsMaster
    /// @param _stablecoin       Endereço da stablecoin (ex: USDC)
    /// @param _owner            Owner da factory (admin do protocolo)
    constructor(
        address _implementation,
        address _masterNftAddress,
        address _stablecoin,
        address _owner
    ) Ownable(_owner) {
        if (
            _implementation   == address(0) ||
            _masterNftAddress == address(0) ||
            _stablecoin       == address(0) ||
            _owner            == address(0)
        ) revert ZeroAddress();

        implementation    = _implementation;
        masterNftAddress  = _masterNftAddress;
        stablecoinAddress = _stablecoin;
    }

    // ─────────────────────────────────────────────────────────
    // CONFIGURAÇÃO (owner only)
    // ─────────────────────────────────────────────────────────

    /// @notice Atualiza o endereço do PlayerRightsMaster para novos vaults.
    function setMasterNftAddress(address _address) external onlyOwner {
        if (_address == address(0)) revert ZeroAddress();
        masterNftAddress = _address;
        emit MasterNftAddressUpdated(_address);
    }

    /// @notice Atualiza o endereço da stablecoin para novos vaults.
    function setStablecoinAddress(address _address) external onlyOwner {
        if (_address == address(0)) revert ZeroAddress();
        stablecoinAddress = _address;
        emit StablecoinAddressUpdated(_address);
    }

    // ─────────────────────────────────────────────────────────
    // CRIAÇÃO DE VAULT
    // ─────────────────────────────────────────────────────────

    /// @notice Cria um novo vault de direito de imagem via clone EIP-1167.
    /// @dev    Clones.clone() cria um proxy mínimo de 45 bytes.
    ///         Em seguida, initialize() é chamado para configurar o estado do clone.
    ///
    /// @param _player      Carteira do jogador
    /// @param _club        Carteira do clube / SPV
    /// @param _attorney    Carteira do advogado
    /// @param _playerBps   Fatia do jogador em basis points (ex: 3000 = 30%)
    /// @param _clubBps     Fatia do clube em basis points
    /// @param _attorneyBps Fatia do advogado em basis points
    /// @return vault       Endereço do clone criado
    function createVault(
        address _player,
        address _club,
        address _attorney,
        uint256 _playerBps,
        uint256 _clubBps,
        uint256 _attorneyBps
    ) external returns (address vault) {
        if (
            _player   == address(0) ||
            _club     == address(0) ||
            _attorney == address(0)
        ) revert ZeroAddress();

        if (_playerBps + _clubBps + _attorneyBps != 10_000) revert InvalidBasisPoints();

        // 1. Cria o clone mínimo (EIP-1167)
        vault = implementation.clone();

        // 2. Inicializa o clone com os dados do contrato de imagem
        //    O owner do clone será a própria factory — você pode ajustar para msg.sender se preferir
        RightsVaultImpl(vault).initialize(
            masterNftAddress,
            stablecoinAddress,
            _player,
            _club,
            _attorney,
            _playerBps,
            _clubBps,
            _attorneyBps,
            msg.sender
        );

        // 3. Registra o vault nos índices para consulta pelo frontend
        _allVaults.push(vault);
        _vaultsByClub[_club].push(vault);
        _vaultsByPlayer[_player].push(vault);

        emit VaultCreated(vault, _player, _club, _attorney, _playerBps, _clubBps, _attorneyBps);
    }

    // ─────────────────────────────────────────────────────────
    // CONSULTAS — FRONTEND / DASHBOARD
    // ─────────────────────────────────────────────────────────

    /// @notice Retorna todos os vaults criados pela factory.
    function getAllVaults() external view returns (address[] memory) {
        return _allVaults;
    }

    /// @notice Retorna todos os vaults de um clube específico.
    function getVaultsByClub(address _club) external view returns (address[] memory) {
        return _vaultsByClub[_club];
    }

    /// @notice Retorna todos os vaults de um jogador específico.
    function getVaultsByPlayer(address _player) external view returns (address[] memory) {
        return _vaultsByPlayer[_player];
    }

    /// @notice Retorna o total de vaults criados.
    function totalVaults() external view returns (uint256) {
        return _allVaults.length;
    }
}
