# TECHNICAL REQUIREMENTS DOCUMENT (TRD)

## Project Name
**MusicCoin Festival Platform**

**Version**: 1.0

---

## 1. System Architecture
The platform adopts an event-driven modular architecture connecting modern web clients, background workers, relational datastores, and the Polygon blockchain network:

```
+-------------------------------------------------------------+
|                      Next.js 15 Frontend                    |
|           (TypeScript, TailwindCSS v4, Wagmi, Viem)         |
+------------------------------+------------------------------+
                               | HTTPS / WSS
                               v
+-------------------------------------------------------------+
|                    Nginx Reverse Proxy                      |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Django 5.2 API Engine                   |
|       (DRF, SimpleJWT, Celery, Channels, drf-spectacular)    |
+--------------+---------------+--------------+---------------+
               |               |              |
               v               v              v
      +-----------------+ +----------+ +----------------------+
      |   PostgreSQL    | |  Redis   | | Polygon (Amoy/Main)  |
      |   Primary DB    | | (Broker) | |   Smart Contracts    |
      +-----------------+ +----+-----+ +----------------------+
                               |
                               v
                      +------------------+
                      |  Celery Workers  |
                      |  (Event Listener |
                      |  & Auto Payouts) |
                      +------------------+
```

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion
- **Web3**: Wagmi v2, Viem, AppKit / WalletConnect
- **State & Data Fetching**: Zustand, TanStack React Query, Axios
- **Form Handling**: React Hook Form, Zod

### Backend
- **Framework**: Django 5.2 + Django REST Framework (DRF)
- **Authentication**: JWT (django-rest-framework-simplejwt) + EIP-4361 SIWE (Sign-In with Ethereum)
- **Asynchronous Tasks**: Celery with Redis broker
- **Real-Time**: Django Channels + Redis channel layer
- **API Documentation**: OpenAPI 3.0 / Swagger (drf-spectacular)
- **Blockchain Interface**: Web3.py / Eth-account

### Database & Storage
- **Relational DB**: PostgreSQL 16
- **Cache & Message Broker**: Redis 7
- **Decentralized Storage**: IPFS (NFT metadata, audio stems, artwork)
- **Cloud Storage**: Cloudflare R2 / S3 (Public assets, promo banners)

### Smart Contracts (Polygon PoS)
- **Language**: Solidity ^0.8.24
- **Framework**: Hardhat with TypeScript
- **Libraries**: OpenZeppelin Contracts (ERC20, ERC721, ERC2981, Ownable, ReentrancyGuard)
- **Target Networks**: Polygon Amoy Testnet (Chain ID 80002) & Polygon Mainnet (Chain ID 137)

---

## 3. Database Schema Overview

```
users (id, email, phone, role, wallet_address, is_verified, created_at)
  │
  ├── artists (id, user_id, stage_name, bio, genres, verification_status, reputation_score)
  │     ├── nfts (id, creator_id, token_id, contract_address, metadata_url, price, royalty_percentage)
  │     └── royalties (id, nft_id, artist_id, percentage, amount, transaction_hash)
  │
  ├── events (id, organizer_id, title, venue, city, event_date, capacity, ticket_price, status)
  │     └── tickets (id, event_id, user_id, nft_token_id, qr_code, status, purchase_date)
  │
  ├── transactions (id, user_id, amount, currency, transaction_type, status, blockchain_hash)
  └── fan_tokens (id, user_id, token_balance, staked_amount, reward_amount)
```

---

## 4. Smart Contract Architecture & Interfaces

1. **`FanToken.sol`**:
   - `stake(uint256 amount, uint256 lockDuration)`
   - `unstake(uint256 positionId)`
   - `claimRewards()`
   - `delegate(address delegatee)` (ERC20Votes)

2. **`ArtistIdentity.sol`**:
   - `applyForVerification(string memory metadataURI)`
   - `verifyArtist(address artistAddress, uint256 initialScore)`
   - `updateReputation(address artistAddress, int256 scoreDelta)`
   - `isArtistVerified(address artistAddress) returns (bool)`

3. **`EventTicket.sol`**:
   - `createEventTiers(uint256 eventId, uint256 maxSupply, uint256 price, uint256 maxResaleCap)`
   - `mintTicket(uint256 eventId, address recipient)`
   - `checkIn(uint256 ticketId)` (Staff / Gatekeeper validation)
   - `beforeTokenTransfer(...)` (Anti-scalping price & cooldown checks)

4. **`MusicNFT.sol`**:
   - `mintNFT(address recipient, string memory tokenURI, address royaltyReceiver, uint96 royaltyFeeBps)`
   - `royaltyInfo(uint256 tokenId, uint256 salePrice) returns (address, uint256)` (ERC-2981)

5. **`RoyaltyDistribution.sol`**:
   - `registerSplit(bytes32 splitId, address[] payees, uint256[] shares)`
   - `distribute(bytes32 splitId) payable`
   - `release(bytes32 splitId, address payee)`
