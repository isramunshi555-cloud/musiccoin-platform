// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MusicNFT is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    enum NFTCategory { SONG, ALBUM, VIP_PASS, COLLECTIBLE }

    struct ItemDetails {
        NFTCategory category;
        address originalCreator;
        uint256 mintedAt;
    }

    struct Listing {
        address seller;
        uint256 price;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => ItemDetails) public itemDetails;
    mapping(uint256 => Listing) public listings;
    mapping(address => bool) public authorizedMinters;

    uint96 public constant MAX_ROYALTY_BPS = 2500;

    event MusicNFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed recipient,
        string tokenURI,
        address royaltyReceiver,
        uint96 royaltyFeeBps,
        NFTCategory category
    );
    event MinterUpdated(address indexed minter, bool status);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event NFTPurchased(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        address royaltyReceiver,
        uint256 royaltyAmount
    );

    error InvalidRoyalty();
    error NotAuthorizedMinter();
    error NotTokenOwner();
    error InvalidPrice();
    error NotListed();
    error IncorrectPayment();
    error PaymentFailed();

    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    constructor(address initialOwner)
        ERC721("MusicCoin Music & Collectibles", "MCNFT")
        Ownable(initialOwner)
    {
        authorizedMinters[initialOwner] = true;
    }

    function setMinter(address minter, bool status) external onlyOwner {
        authorizedMinters[minter] = status;
        emit MinterUpdated(minter, status);
    }

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

    function listNFT(uint256 tokenId, uint256 price) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (price == 0) revert InvalidPrice();

        listings[tokenId] = Listing({seller: msg.sender, price: price});
        emit NFTListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        if (listing.price == 0) revert NotListed();
        if (listing.seller != msg.sender) revert NotTokenOwner();

        delete listings[tokenId];
        emit ListingCancelled(tokenId, msg.sender);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        if (listing.price == 0) revert NotListed();
        if (ownerOf(tokenId) != listing.seller) revert NotListed();
        if (msg.value != listing.price) revert IncorrectPayment();

        delete listings[tokenId];
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(
            tokenId,
            listing.price
        );

        _safeTransfer(listing.seller, msg.sender, tokenId, "");

        if (
            royaltyReceiver != address(0) &&
            royaltyAmount > 0 &&
            royaltyReceiver != listing.seller
        ) {
            _pay(royaltyReceiver, royaltyAmount);
            _pay(listing.seller, listing.price - royaltyAmount);
        } else {
            _pay(listing.seller, listing.price);
        }

        emit NFTPurchased(
            tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            royaltyReceiver,
            royaltyAmount
        );
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function getItemDetails(uint256 tokenId)
        external
        view
        returns (ItemDetails memory)
    {
        return itemDetails[tokenId];
    }

    function _pay(address recipient, uint256 amount) private {
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert PaymentFailed();
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address previousOwner = super._update(to, tokenId, auth);
        if (previousOwner != address(0) && previousOwner != to) {
            delete listings[tokenId];
        }
        return previousOwner;
    }

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