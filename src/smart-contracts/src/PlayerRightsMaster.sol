// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PlayerRightsMaster is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    address public authorizedMinter;
    mapping(address => bool) public authorizedOperators;

    error CallerNotAuthorized();
    error ZeroAddress();

    event AuthorizedMinterUpdated(address indexed minter);
    event OperatorAuthorizationUpdated(address indexed operator, bool allowed);
    event RightsMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);

    constructor(address initialOwner) ERC721("Player Rights Master", "PRM") Ownable(initialOwner) {}

    function setAuthorizedMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        authorizedMinter = _minter;
        emit AuthorizedMinterUpdated(_minter);
    }

    function setAuthorizedOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        authorizedOperators[operator] = allowed;
        emit OperatorAuthorizationUpdated(operator, allowed);
    }

    function mintRights(address recipient, string calldata uri) external returns (uint256) {
        if (msg.sender != authorizedMinter) revert CallerNotAuthorized();
        if (recipient == address(0)) revert ZeroAddress();

        uint256 tokenId = ++_nextTokenId;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit RightsMinted(tokenId, recipient, uri);
        return tokenId;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0) && !authorizedOperators[msg.sender]) {
            revert CallerNotAuthorized();
        }

        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
