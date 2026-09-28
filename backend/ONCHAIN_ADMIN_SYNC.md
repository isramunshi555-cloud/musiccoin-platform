# Polygon Amoy → Django admin

The marketplace and staking pages write to Polygon Amoy. Run `sync_musiccoin` on
the EC2 server to index confirmed contract logs into Django's NFT items,
listings, staking records and on-chain royalty records. Existing `RoyaltyPayout`
rows are for configured splits; `OnchainNFTRoyalty` tracks separate NFT royalty
payments. When the NFT creator also sells the NFT, the smart contract pays the
seller the whole price and there is no separate royalty transfer.

1. On EC2, after pulling the branch, install the extra dependency and migrate:

   ```bash
   cd ~/musiccoin-platform/backend
   .venv/bin/python -m pip install -r requirements-onchain.txt
   .venv/bin/python manage.py migrate --noinput
   ```

2. Put the existing deployed Amoy contract addresses in `backend/.env`:

   ```text
   MUSIC_NFT_ADDRESS=0x...
   MUSIC_TOKEN_ADDRESS=0x...
   MUSIC_SYNC_START_BLOCK=<block when contracts were deployed>
   POLYGON_AMOY_RPC_URL=https://polygon-amoy.drpc.org
   ```

   Copy the first two values from `frontend/.env.local` (`NEXT_PUBLIC_MUSIC_NFT_ADDRESS`
   and `NEXT_PUBLIC_MUSIC_TOKEN_ADDRESS`). Use the deployed contract's creation
   block for `MUSIC_SYNC_START_BLOCK`; scanning from zero is unnecessarily slow.
   Never put a private key in this file for this command.

3. Run `../backend/.venv/bin/python manage.py sync_musiccoin --once` inside
   `backend/`. The command scans 500 blocks per RPC call up to three blocks
   behind the tip, saves its cursor, and can be rerun safely. To index just a
   known sale immediately: `.venv/bin/python manage.py sync_musiccoin
   --tx-hash 0x<transaction-hash>`. Then scan the complete history to include
   mint and listing events. The command checks the network ID and confirmed
   receipt before saving anything.

4. Schedule it after the initial backfill:

   ```bash
   (crontab -l 2>/dev/null; echo '* * * * * cd /home/ubuntu/musiccoin-platform/backend && /home/ubuntu/musiccoin-platform/backend/.venv/bin/python manage.py sync_musiccoin --once >> /home/ubuntu/musiccoin-sync.log 2>&1') | crontab -
   ```

   Add the cron entry only once. Inspect `~/musiccoin-sync.log` if records stop
   updating. A Django user is linked only when their `wallet_address` matches
   the event's address; otherwise the admin row still shows the wallet and the
   user field stays empty. Do not assign a wallet to a user without verifying
   who controls it.

Do not create NFT items/listings manually for chain transactions. The command
records the actual seller, buyer and token IDs from verified logs and avoids
duplicate records when blocks are rechecked.
