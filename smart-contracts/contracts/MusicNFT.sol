// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MusicNFT
 * @notice ERC-721 Music and Festival Collectible with ERC-2981 on-chain royalty distribution.
 */
contract MusicNFT is ERC721URIStorage, ERC2981, Ownable {
    enum NFTCategory {
        SONG,
        ALBUM,
        VIP_PASS,
        COLLECTIBLE
    }

    struct ItemDetails {
        NFTCategory category;
        address originalCreator;
        uint256 mintedAt;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => ItemDetails) public itemDetails;
    mapping(address => bool) public authorizedMinters;

    uint96 public constant MAX_ROYALTY_BPS = 2500; // 25% max royalty

    event MusicNFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed recipient,
        string tokenURI,
        address royaltyReceiver,
        uint96 royaltyFeeBps,
        NFTCategory category
    );
    event MinterStatusUpdated(address indexed minter, bool status);

    error InvalidRoyalty();
    error NotAuthorizedMinter();

    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) revert NotAuthorizedMinter();
        _;
    }

    constructor(address initialOwner) ERC721("MusicCoin Music & Collectibles", "MCNFT") Ownable(initialOwner) {
        authorizedMinters[initialOwner] = true;
    }

    function setMinter(address minter, bool status) external onlyOwner {
        authorizedMinters[minter] = status;
        emit MinterUpdated(minter, status);
    }

    event MinterUpdated(address indexed minter, bool status);

    /**
     * @notice Mints a new Music NFT with embedded ERC-2981 royalty settings.
     * @param recipient Collector or buyer address receiving the NFT.
     * @param uri IPFS or decentralized metadata URI.
     * @param royaltyReceiver Address or RoyaltyDistribution contract receiving secondary royalties.
     * @param royaltyFeeBps Royalty basis points (e.g. 500 = 5%).
     * @param category Category enum (SONG, ALBUM, VIP_PASS, COLLECTIBLE).
     */
    function mintMusicNFT(
        address recipient,
        string calldata uri,
        address royaltyReceiver,
        uint96 royaltyFeeBps,
        NFTCategory category
    ) external onlyMinter returns (uint256) {
        if (royaltyFeeBps > MAX_ROYALTY_BPS) revert InvalidRoyalty();

        uint256 tokenId = ++_nextTokenId;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        if (royaltyReceiver != address(0) && royaltyFeeBps > 0) {
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeBps);
        }

        itemDetails[tokenId] = ItemDetails({
            category: category,
            originalCreator: msg.sender,
            mintedAt: block.timestamp
        });

        emit MusicNFTMinted(
            tokenId,
            msg.sender,
            recipient,
            uri,
            royaltyReceiver,
            royaltyFeeBps,
            category
        );

        return tokenId;
    }

    function getItemDetails(uint256 tokenId) external view returns (ItemDetails memory) {
        return itemDetails[tokenId];
    }

    // Required overrides for ERC721URIStorage and ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
