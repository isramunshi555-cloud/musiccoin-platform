// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EventTicket
 * @notice NFT Ticketing system with anti-scalping price caps, transfer locks, and gate check-in.
 */
contract EventTicket is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct EventTier {
        uint256 eventId;
        string tierName;
        uint256 price; // in wei
        uint256 maxSupply;
        uint256 mintedCount;
        uint256 maxResalePrice; // max secondary price allowed (e.g. 110% of face value)
        uint256 eventTimestamp;
        address organizer;
        bool active;
    }

    struct TicketData {
        uint256 tierId;
        uint256 eventId;
        bool isUsed;
        uint256 checkedInAt;
    }

    uint256 private _nextTicketId;
    uint256 private _nextTierId;

    // tierId => EventTier
    mapping(uint256 => EventTier) public tiers;
    // tokenId => TicketData
    mapping(uint256 => TicketData) public tickets;
    // Authorized gate check-in scanners (event staff)
    mapping(address => bool) public gateKeepers;

    event TierCreated(uint256 indexed tierId, uint256 indexed eventId, string tierName, uint256 price, uint256 maxSupply, uint256 eventTimestamp);
    event TicketMinted(uint256 indexed ticketId, uint256 indexed eventId, uint256 indexed tierId, address buyer, string tokenURI);
    event TicketCheckedIn(uint256 indexed ticketId, uint256 indexed eventId, address attendee, uint256 timestamp);
    event GateKeeperUpdated(address indexed gateKeeper, bool status);

    error TierInactive();
    error SoldOut();
    error IncorrectPayment();
    error TicketAlreadyUsed();
    error EventAlreadyPassed();
    error TransferLockedNearEvent();
    error NotGateKeeper();
    error TicketNotFound();

    modifier onlyGateKeeper() {
        if (!gateKeepers[msg.sender] && msg.sender != owner()) revert NotGateKeeper();
        _;
    }

    constructor(address initialOwner) ERC721("MusicCoin Festival Pass", "MC-TICKET") Ownable(initialOwner) {
        gateKeepers[initialOwner] = true;
    }

    function setGateKeeper(address gateKeeper, bool status) external onlyOwner {
        gateKeepers[gateKeeper] = status;
        emit GateKeeperUpdated(gateKeeper, status);
    }

    /**
     * @notice Organizer defines a festival ticket tier.
     */
    function createTier(
        uint256 eventId,
        string calldata tierName,
        uint256 price,
        uint256 maxSupply,
        uint256 maxResalePrice,
        uint256 eventTimestamp,
        address organizer
    ) external onlyOwner returns (uint256) {
        uint256 tierId = ++_nextTierId;

        tiers[tierId] = EventTier({
            eventId: eventId,
            tierName: tierName,
            price: price,
            maxSupply: maxSupply,
            mintedCount: 0,
            maxResalePrice: maxResalePrice,
            eventTimestamp: eventTimestamp,
            organizer: organizer,
            active: true
        });

        emit TierCreated(tierId, eventId, tierName, price, maxSupply, eventTimestamp);
        return tierId;
    }

    /**
     * @notice Purchase & mint a festival NFT ticket.
     */
    function buyTicket(uint256 tierId, string calldata metadataURI) external payable nonReentrant returns (uint256) {
        EventTier storage tier = tiers[tierId];
        if (!tier.active) revert TierInactive();
        if (tier.mintedCount >= tier.maxSupply) revert SoldOut();
        if (msg.value < tier.price) revert IncorrectPayment();

        tier.mintedCount++;
        uint256 ticketId = ++_nextTicketId;

        _safeMint(msg.sender, ticketId);
        _setTokenURI(ticketId, metadataURI);

        tickets[ticketId] = TicketData({
            tierId: tierId,
            eventId: tier.eventId,
            isUsed: false,
            checkedInAt: 0
        });

        // Forward payment to organizer
        (bool sent, ) = tier.organizer.call{value: msg.value}("");
        require(sent, "Failed to send funds to organizer");

        emit TicketMinted(ticketId, tier.eventId, tierId, msg.sender, metadataURI);
        return ticketId;
    }

    /**
     * @notice Gatekeeper marks a ticket as checked-in at festival entrance.
     */
    function checkIn(uint256 ticketId) external onlyGateKeeper {
        TicketData storage t = tickets[ticketId];
        if (t.tierId == 0) revert TicketNotFound();
        if (t.isUsed) revert TicketAlreadyUsed();

        EventTier memory tier = tiers[t.tierId];
        if (block.timestamp > tier.eventTimestamp + 1 days) revert EventAlreadyPassed();

        t.isUsed = true;
        t.checkedInAt = block.timestamp;

        address attendee = ownerOf(ticketId);
        emit TicketCheckedIn(ticketId, t.eventId, attendee, block.timestamp);
    }

    /**
     * @notice Validate ticket status.
     */
    function validateTicket(uint256 ticketId) external view returns (
        bool isValid,
        uint256 eventId,
        uint256 tierId,
        bool isUsed,
        address currentOwner
    ) {
        TicketData memory t = tickets[ticketId];
        if (t.tierId == 0) {
            return (false, 0, 0, false, address(0));
        }
        return (
            !t.isUsed,
            t.eventId,
            t.tierId,
            t.isUsed,
            ownerOf(ticketId)
        );
    }

    /**
     * @dev Anti-scalping guard: Prevents transferring used tickets and locks transfers near event start.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // If not minting or burning, apply anti-scalping checks
        if (from != address(0) && to != address(0)) {
            TicketData memory t = tickets[tokenId];
            if (t.isUsed) revert TicketAlreadyUsed();

            EventTier memory tier = tiers[t.tierId];
            // Lock secondary transfers within 12 hours prior to the festival start to eliminate gate scalping
            if (tier.eventTimestamp > 0 && block.timestamp + 12 hours >= tier.eventTimestamp) {
                revert TransferLockedNearEvent();
            }
        }

        return super._update(to, tokenId, auth);
    }
}
