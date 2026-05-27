// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PlayerRightsMaster is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;


    address public authorizedMinter;

    error CallerNotAuthorized();
    error ZeroAddress();

    event RightsMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI
    );

    constructor(
        address initialOwner
    ) ERC721("Player Rights Master", "PRM") Ownable(initialOwner) {}


    function setAuthorizedMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        authorizedMinter = _minter;
    }

    
    function mintRights(
        address recipient,
        string calldata uri
    ) external returns (uint256) {
        if (msg.sender != authorizedMinter) revert CallerNotAuthorized();

        uint256 tokenId = ++_nextTokenId;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit RightsMinted(tokenId, recipient, uri);

        return tokenId;
    }
}