// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RightsVaultImpl} from "./RightsVaultImpl.sol";

contract RightsVaultFactory is Ownable {
    using Clones for address;

    address public immutable implementation;
    address public masterNftAddress;
    address public stablecoinAddress;

    address[] private _allVaults;
    mapping(address => address[]) private _vaultsByClub;
    mapping(address => address[]) private _vaultsByPlayer;

    event VaultCreated(
        address indexed vault,
        address indexed player,
        address indexed club,
        address attorney,
        uint256 playerBps,
        uint256 clubBps,
        uint256 attorneyBps,
        string tokenName,
        string tokenSymbol
    );

    event MasterNftAddressUpdated(address indexed newAddress);
    event StablecoinAddressUpdated(address indexed newAddress);

    error ZeroAddress();
    error InvalidBasisPoints();
    error InvalidTokenMetadata();

    constructor(
        address _implementation,
        address _masterNftAddress,
        address _stablecoin,
        address _owner
    ) Ownable(_owner) {
        if (
            _implementation == address(0) ||
            _masterNftAddress == address(0) ||
            _stablecoin == address(0) ||
            _owner == address(0)
        ) revert ZeroAddress();

        implementation = _implementation;
        masterNftAddress = _masterNftAddress;
        stablecoinAddress = _stablecoin;
    }

    function setMasterNftAddress(address _address) external onlyOwner {
        if (_address == address(0)) revert ZeroAddress();
        masterNftAddress = _address;
        emit MasterNftAddressUpdated(_address);
    }

    function setStablecoinAddress(address _address) external onlyOwner {
        if (_address == address(0)) revert ZeroAddress();
        stablecoinAddress = _address;
        emit StablecoinAddressUpdated(_address);
    }

    function createVault(
        address _player,
        address _club,
        address _attorney,
        uint256 _playerBps,
        uint256 _clubBps,
        uint256 _attorneyBps,
        string calldata tokenName_,
        string calldata tokenSymbol_
    ) external returns (address vault) {
        if (
            _player == address(0) ||
            _club == address(0) ||
            _attorney == address(0)
        ) revert ZeroAddress();

        if (_playerBps + _clubBps + _attorneyBps != 10_000) revert InvalidBasisPoints();
        if (bytes(tokenName_).length == 0 || bytes(tokenSymbol_).length == 0) revert InvalidTokenMetadata();

        vault = implementation.clone();

        RightsVaultImpl(vault).initialize(
            masterNftAddress,
            stablecoinAddress,
            _player,
            _club,
            _attorney,
            _playerBps,
            _clubBps,
            _attorneyBps,
            msg.sender,
            tokenName_,
            tokenSymbol_
        );

        _allVaults.push(vault);
        _vaultsByClub[_club].push(vault);
        _vaultsByPlayer[_player].push(vault);

        emit VaultCreated(
            vault,
            _player,
            _club,
            _attorney,
            _playerBps,
            _clubBps,
            _attorneyBps,
            tokenName_,
            tokenSymbol_
        );
    }

    function getAllVaults() external view returns (address[] memory) {
        return _allVaults;
    }

    function getVaultsByClub(address _club) external view returns (address[] memory) {
        return _vaultsByClub[_club];
    }

    function getVaultsByPlayer(address _player) external view returns (address[] memory) {
        return _vaultsByPlayer[_player];
    }

    function totalVaults() external view returns (uint256) {
        return _allVaults.length;
    }
}