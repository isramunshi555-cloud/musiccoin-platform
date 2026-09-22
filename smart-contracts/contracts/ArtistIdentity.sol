// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtistIdentity (SBT / DID)
 * @notice Soulbound identity badge and reputation registry for verified artists on MusicCoin.
 */
contract ArtistIdentity is ERC721URIStorage, Ownable {
    struct ArtistProfile {
        string stageName;
        string metadataURI;
        uint256 verificationDate;
        int256 reputationScore;
        bool isVerified;
        uint256 tokenId;
    }

    uint256 private _nextTokenId;
    // Mapping from artist address to their Profile
    mapping(address => ArtistProfile) public artists;
    mapping(address => bool) public verifiers;
    mapping(uint256 => address) public tokenToArtist;

    event ArtistApplicationSubmitted(address indexed artist, string stageName, string metadataURI);
    event ArtistVerified(address indexed artist, uint256 indexed tokenId, string stageName, uint256 initialScore);
    event ArtistRevoked(address indexed artist);
    event ReputationUpdated(address indexed artist, int256 newScore, int256 delta);
    event VerifierStatusUpdated(address indexed verifier, bool status);

    error SoulboundNonTransferable();
    error AlreadyVerified();
    error NotVerified();
    error NotAuthorizedVerifier();
    error EmptyStageName();

    modifier onlyVerifier() {
        if (!verifiers[msg.sender] && msg.sender != owner()) revert NotAuthorizedVerifier();
        _;
    }

    constructor(address initialOwner) ERC721("MusicCoin Verified Artist", "MC-ARTIST") Ownable(initialOwner) {
        verifiers[initialOwner] = true;
    }

    function setVerifier(address verifier, bool status) external onlyOwner {
        verifiers[verifier] = status;
        emit VerifierStatusUpdated(verifier, status);
    }

    /**
     * @notice Artist applies for on-chain verification badge.
     */
    function applyForVerification(string calldata stageName, string calldata metadataURI) external {
        if (bytes(stageName).length == 0) revert EmptyStageName();
        if (artists[msg.sender].isVerified) revert AlreadyVerified();

        artists[msg.sender].stageName = stageName;
        artists[msg.sender].metadataURI = metadataURI;

        emit ArtistApplicationSubmitted(msg.sender, stageName, metadataURI);
    }

    /**
     * @notice Approves an artist and mints a Soulbound Verification NFT to their address.
     */
    function verifyArtist(
        address artistAddress,
        string calldata stageName,
        string calldata metadataURI,
        uint256 initialScore
    ) external onlyVerifier returns (uint256) {
        if (artists[artistAddress].isVerified) revert AlreadyVerified();

        uint256 tokenId = ++_nextTokenId;
        _safeMint(artistAddress, tokenId);
        _setTokenURI(tokenId, metadataURI);

        artists[artistAddress] = ArtistProfile({
            stageName: stageName,
            metadataURI: metadataURI,
            verificationDate: block.timestamp,
            reputationScore: int256(initialScore),
            isVerified: true,
            tokenId: tokenId
        });

        tokenToArtist[tokenId] = artistAddress;

        emit ArtistVerified(artistAddress, tokenId, stageName, initialScore);
        return tokenId;
    }

    /**
     * @notice Revokes artist verification badge in case of severe fraud or disputes.
     */
    function revokeVerification(address artistAddress) external onlyVerifier {
        if (!artists[artistAddress].isVerified) revert NotVerified();

        uint256 tokenId = artists[artistAddress].tokenId;
        artists[artistAddress].isVerified = false;
        _burn(tokenId);
        delete tokenToArtist[tokenId];

        emit ArtistRevoked(artistAddress);
    }

    /**
     * @notice Updates the reputation score of an artist.
     */
    function updateReputation(address artistAddress, int256 delta) external onlyVerifier {
        if (!artists[artistAddress].isVerified) revert NotVerified();

        artists[artistAddress].reputationScore += delta;
        emit ReputationUpdated(artistAddress, artists[artistAddress].reputationScore, delta);
    }

    function isArtistVerified(address artistAddress) external view returns (bool) {
        return artists[artistAddress].isVerified;
    }

    function getArtist(address artistAddress) external view returns (ArtistProfile memory) {
        return artists[artistAddress];
    }

    /**
     * @dev Enforce Soulbound behavior: prevent transfers between non-zero addresses.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Minting (from == 0) and Burning (to == 0) are allowed, standard transfers are forbidden
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }
}
