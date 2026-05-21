// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract RightsVault is ERC20, IERC721Receiver, Ownable {
    IERC721 public immutable masterNft;

    uint256 public lockedTokenId;
    bool public isFractionalized;

    error VaultAlreadyInitialized();
    error NotNFTOwner();

    event Fractionalized(
        uint256 indexed tokenId,
        uint256 totalShares,
        address indexed depositor
    );

    constructor(
        address _masterNftAddress,
        address initialOwner
    ) ERC20("Player Image Rights", "P_IMAGE") Ownable(initialOwner) {
        masterNft = IERC721(_masterNftAddress);
    }

    /**
     * @notice Locks the Master NFT and mints fractional ERC-20 shares.
     * @param _tokenId The ID of the Master NFT to lock.
     * @param _supply The total number of ERC-20 tokens to mint (remember 18 decimals).
     */
    function fractionalize(uint256 _tokenId, uint256 _supply) external {
        if (isFractionalized) revert VaultAlreadyInitialized();
        if (masterNft.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();

        // Lock the vault to prevent any other NFTs from being deposited
        isFractionalized = true;
        lockedTokenId = _tokenId;

        // Transfer the NFT from the SPV to this Vault
        // Note: The SPV MUST call `approve()` on the Master NFT contract before calling this.
        masterNft.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Mint the fungible $P_IMAGE tokens to the SPV
        _mint(msg.sender, _supply);

        emit Fractionalized(_tokenId, _supply, msg.sender);
    }

    /**
     * @notice Standard interface required to accept safeTransferFrom from an ERC721.
     */
    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
