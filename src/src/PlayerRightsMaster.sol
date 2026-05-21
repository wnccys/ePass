// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract PlayerRightsMaster is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // The ONLY address allowed to mint (This will be the RightsMinter contract)
    address public authorizedMinter;

    error CallerNotAuthorized();
    event RightsMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI
    );

    constructor(
        address initialOwner
    ) ERC721("Player Rights Master", "PRM") Ownable(initialOwner) {}

    /**
     * @notice Links the gateway contract.
     */
    function setAuthorizedMinter(address _minter) external onlyOwner {
        authorizedMinter = _minter;
    }

    /**
     * @notice Mints the master NFT representing the off-chain legal rights.
     * @param recipient The address receiving the NFT (The SPV Safe or the Vault).
     * @param uri The IPFS link to the hashed legal documents.
     */
    function mintRights(
        address recipient,
        string calldata uri
    ) external returns (uint256) {
        if (msg.sender != authorizedMinter) revert CallerNotAuthorized();

        // Increment ID (starts at 1)
        uint256 tokenId = ++_nextTokenId;

        // Mint the token to the target address
        _safeMint(recipient, tokenId);

        // Attach the immutable off-chain metadata (legal docs)
        _setTokenURI(tokenId, uri);

        emit RightsMinted(tokenId, recipient, uri);

        return tokenId;
    }
}
