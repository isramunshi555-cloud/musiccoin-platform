# MusicCoin Platform

MusicCoin is a deployed music and event platform built with Next.js, Django REST Framework, PostgreSQL, and Solidity contracts on the Polygon Amoy testnet. It supports role-based accounts for fans, artists, organizers, production houses, and administrators.

## Live project

- [Website](https://13.50.242.90.nip.io/)
- [Events](https://13.50.242.90.nip.io/events)
- [API documentation](https://13.50.242.90.nip.io/api/docs/)
- [GitHub repository](https://github.com/isramunshi555-cloud/musiccoin-platform/tree/feature/real-nft-marketplace)
- Contact: isramunshi555@gmail.com

## Features

- Email registration, JWT login, password reset by email, and role-based dashboards.
- Event discovery, organizer event management, fiat ticket reservations, QR tickets, and organizer-controlled check-in with duplicate-use prevention.
- Polygon Amoy wallet connection, MUSIC transfers and staking, music NFT minting and marketplace purchases.
- Separate on-chain demos for NFT mint/list/buy, ticket tiers/buy/check-in, artist verification, and royalty splits/distribution/release.
- Django admin records for users, events, tickets, check-ins, NFT activity, staking, and monitored wallet activity; selected blockchain transactions are indexed into PostgreSQL.
- Event and platform analytics.

## Demo walkthrough

1. Open the live website and **Explore Festivals**; register or use a dedicated demo fan account to reserve a ticket and view its QR code under **My Tickets**.
2. Use the matching organizer account to scan the ticket during its event window. A second scan must be denied. Inspect the check-in in Django admin if you have a separately issued staff account.
3. Connect a MetaMask wallet on **Polygon Amoy** for MUSIC, staking, and marketplace demonstrations. Contract actions need testnet POL for gas. Some functions require the contract owner, minter, verifier, or gatekeeper wallet.
4. Test password recovery with an account whose inbox you control; follow the reset link and log in with the new password.

Do not put passwords, private keys, seed phrases, or server environment files in this repository. A public wallet address identifies a wallet but cannot authorize its transactions. Demo credentials should be issued privately as temporary, least-privilege accounts.

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework, Simple JWT |
| Data | PostgreSQL; Polygon Amoy contracts and a background event sync |
| Deployment | AWS EC2, Gunicorn, Nginx, HTTPS |

The frontend calls the Django API through Nginx. Django stores application records in PostgreSQL. Wallet-based actions submit transactions to Polygon Amoy; the on-chain demo panels and Django ticketing are separate workflows.

## Verification and scope

The live deployment passed 11 backend tests and a Django system check; PostgreSQL, backend, frontend, and Nginx were active, and the site returned HTTPS 200. Live walkthroughs confirmed password recovery, reservation and QR admission, duplicate-entry rejection, wallet transfer monitoring, staking, NFT mint/list/buy, artist verification, on-chain ticket creation/purchase/check-in, and split/revenue/release transactions.

This is a **testnet MVP**. Fiat ticket reservation does not collect a payment. The standalone on-chain ticket contract currently permits check-in before the event start timestamp; the Django QR scanner enforces the event window. Some on-chain artist and royalty operations are not mirrored into the corresponding Django admin tables. Production payment, full synchronization, and the on-chain time check remain future work.

## Local development

The repository contains `backend/`, `frontend/`, and `smart-contracts/`. Use Python 3.12+, Node.js 20+, and PostgreSQL. Install backend packages from `backend/requirements.txt` in a virtual environment, configure private `backend/.env` values, migrate, and start Django. Install frontend packages with `npm ci` in `frontend/`, configure private frontend variables, and run `npm run dev`. Smart-contract deployment uses the scripts in `smart-contracts/`; never commit deployer keys.
