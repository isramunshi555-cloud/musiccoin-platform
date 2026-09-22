# SYSTEM ARCHITECTURE: MUSICCOIN PLATFORM

## 1. High-Level Architecture

The MusicCoin platform is partitioned into 4 primary layers:
1. **Presentation Layer (Next.js 15 Web & Mobile Portal)**
2. **Gateway & API Layer (Nginx & Django REST Framework)**
3. **Asynchronous & Data Layer (Celery, Redis, PostgreSQL)**
4. **Decentralized Blockchain Layer (Polygon PoS, OpenZeppelin Smart Contracts, IPFS)**

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                 |
|  +---------------------------+  +---------------------------+  +-------------------+  |
|  |     Fan Web App           |  |     Artist Studio         |  | Organizer Portal  |  |
|  | (Tickets, Marketplace,    |  | (Minting, Profile DID,    |  | (Events, Scanner, |  |
|  |  Staking, Governance)     |  |  Royalty Analytics)       |  |  Check-In Gate)   |  |
|  +-------------+-------------+  +-------------+-------------+  +---------+---------+  |
+----------------|------------------------------|--------------------------|------------+
                 | REST / JWT                   | Sign-In With Ethereum    | WebSockets
                 +------------------------------+--------------------------+
                                                |
                                                v
+---------------------------------------------------------------------------------------+
|                                    API GATEWAY                                        |
|                       Nginx Reverse Proxy & SSL Termination                           |
+-----------------------------------------------+---------------------------------------+
                                                |
                                                v
+---------------------------------------------------------------------------------------+
|                                APPLICATION SERVER (DJANGO 5.2)                        |
|  +------------------------+------------------------+-------------------------------+  |
|  | apps.authentication    | apps.users             | apps.artists                  |  |
|  | JWT & SIWE Auth        | Roles & Wallets        | Verification & Bio            |  |
|  +------------------------+------------------------+-------------------------------+  |
|  | apps.events            | apps.tickets           | apps.nft                      |  |
|  | Lineups & Venues       | Dynamic Mint & QR      | Marketplace & IPFS            |  |
|  +------------------------+------------------------+-------------------------------+  |
|  | apps.royalties         | apps.wallet            | apps.analytics                |  |
|  | Multi-Party Splits     | Staking & Transfers    | Metabase / Aggregators        |  |
|  +------------------------+------------------------+-------------------------------+  |
+-------------------+---------------------------+---------------------------------------+
                    |                           |
                    v                           v
+----------------------------------+   +------------------------------------------------+
|         DATA STORAGE             |   |            ASYNC TASK WORKERS (CELERY)         |
|  +----------------------------+  |   |  +------------------------------------------+  |
|  | PostgreSQL 16 (Primary DB)  |  |   |  | Blockchain Event Listener (Polygon Amoy) |  |
|  +----------------------------+  |   |  | Minting Queue & Nonce Manager            |  |
|  | Redis 7 (Cache & Channels) |  |   |  | Automatic Royalty Split Execution        |  |
|  +----------------------------+  |   |  | QR Code Ticket Verification Validation   |  |
+----------------------------------+   |  +------------------------------------------+  |
                                       +------------------------------------------------+
                                                        |
                                                        v Web3.py RPC
+---------------------------------------------------------------------------------------+
|                             POLYGON BLOCKCHAIN & IPFS LAYER                           |
|  +-----------------+  +-----------------+  +------------------+  +-----------------+  |
|  |   FanToken.sol  |  |   MusicNFT.sol  |  |  EventTicket.sol |  | RoyaltySplit.sol|  |
|  |   (ERC-20/Votes)|  |   (ERC-721/2981)|  |  (Anti-Scalp NFT)|  | (Auto-Splitter) |  |
|  +-----------------+  +-----------------+  +------------------+  +-----------------+  |
|  +-----------------+  +------------------------------------------------------------+  |
|  | ArtistIdentity  |  | IPFS Network (Pinata / Filecoin decentralized media & stems)|  |
|  | (SBT DID Badge) |  |                                                            |  |
|  +-----------------+  +------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

## 2. Blockchain Transaction Flows

### 2.1 NFT Ticket Purchasing & Gate Check-in
1. Fan selects a festival tier on the frontend.
2. Checkout initiates via connected wallet (paying with native MATIC or MUSIC tokens) or Stripe fiat checkout.
3. If paying with crypto, `EventTicket.sol` mints the NFT directly to the user's wallet address.
4. If paying with fiat, backend relayer mints the ticket on behalf of the user's linked wallet.
5. Django generates a dynamic time-decaying HMAC signature encoded into a QR code.
6. Gate staff scans the QR code using the Organizer Portal; backend validates cryptographic authenticity and marks the ticket as checked-in.

### 2.2 Music NFT Minting & Secondary Royalty Distribution
1. Artist uploads audio file and cover art to IPFS.
2. Artist calls `MusicNFT.sol.mintNFT(...)` specifying royalty fee basis points (e.g., 500 = 5%) and the `RoyaltyDistribution.sol` splitter address as the receiver.
3. When sold on secondary marketplaces conforming to ERC-2981, royalties are automatically transferred into the splitter contract.
4. The splitter automatically credits the Artist, Producer, and Record Label based on their pre-configured share ratios.
