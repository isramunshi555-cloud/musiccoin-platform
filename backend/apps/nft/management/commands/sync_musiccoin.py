"""Index verified Polygon Amoy contract events into Django admin.

Run every minute with --once; use --tx-hash to replay a historical receipt.
The public RPC is a data source: never accept client-supplied sale or reward data.
"""

import json
from datetime import datetime, timedelta, timezone as utc_timezone
from decimal import Decimal
from urllib.request import Request, urlopen

from decouple import config
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from eth_hash.auto import keccak

from apps.nft.models import ChainEvent, ChainSyncCursor, NFTItem, NFTListing
from apps.royalties.models import OnchainNFTRoyalty
from apps.users.models import User
from apps.wallet.models import StakingRecord, WalletTransaction


def topic(signature):
    return "0x" + keccak(signature.encode()).hex()


EVENTS = {
    topic("MusicNFTMinted(uint256,address,address,string,address,uint96,uint8)"): "mint",
    topic("NFTListed(uint256,address,uint256)"): "list",
    topic("ListingCancelled(uint256,address)"): "cancel",
    topic("NFTPurchased(uint256,address,address,uint256,address,uint256)"): "buy",
    topic("Transfer(address,address,uint256)"): "transfer",
    topic("Staked(address,uint256,uint256,uint256,uint256)"): "stake",
    topic("Unstaked(address,uint256,uint256,uint256)"): "unstake",
    topic("RewardClaimed(address,uint256,uint256)"): "claim",
}
UNIT = Decimal(10) ** 18
SIX = Decimal("0.000001")
CATEGORIES = ("SONG", "ALBUM", "VIP_PASS", "COLLECTIBLE")


def amount(value):
    return (Decimal(value) / UNIT).quantize(SIX)


def word(data, index):
    return int(data[2 + index * 64:2 + (index + 1) * 64], 16)


def address(value):
    return "0x" + value[-40:].lower()


def account(wallet):
    return User.objects.filter(wallet_address__iexact=wallet).first()


def decode_string(data):
    offset = word(data, 0)
    length = word(data, offset // 32)
    return bytes.fromhex(data[2 + (offset + 32) * 2:2 + (offset + 32 + length) * 2]).decode("utf-8", errors="replace")


class RPC:
    def __init__(self, url):
        self.url = url

    def call(self, method, params):
        payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
        request = Request(self.url, payload, {"Content-Type": "application/json"})
        with urlopen(request, timeout=25) as response:
            data = json.load(response)
        if "error" in data:
            raise CommandError(f"RPC {method}: {data['error']}")
        return data.get("result")


class Command(BaseCommand):
    help = "Sync confirmed MusicNFT and FanToken Amoy events into Django admin"

    def add_arguments(self, parser):
        parser.add_argument("--tx-hash", help="Backfill one confirmed transaction receipt")
        parser.add_argument("--from-block", type=int, help="Start or replay from this block")
        parser.add_argument("--to-block", type=int, help="Stop at this block (inclusive)")
        parser.add_argument("--once", action="store_true", help="Sync through the current finalized head")

    def handle(self, *args, **options):
        self.nft = config("MUSIC_NFT_ADDRESS", default="").lower()
        self.token = config("MUSIC_TOKEN_ADDRESS", default="").lower()
        if any(len(a) != 42 or not a.startswith("0x") for a in (self.nft, self.token)):
            raise CommandError("Set MUSIC_NFT_ADDRESS and MUSIC_TOKEN_ADDRESS in backend/.env")
        self.rpc = RPC(config("POLYGON_AMOY_RPC_URL", default="https://polygon-amoy.drpc.org"))
        if int(self.rpc.call("eth_chainId", []), 16) != 80002:
            raise CommandError("RPC must point to Polygon Amoy (chain ID 80002)")
        if options["tx_hash"]:
            receipt = self.rpc.call("eth_getTransactionReceipt", [options["tx_hash"]])
            if receipt is None or receipt["status"] != "0x1":
                raise CommandError("Transaction missing or not confirmed successfully")
            with transaction.atomic():
                self.process(receipt["logs"])
            self.stdout.write("Verified receipt synced")
            return
        key = f"amoy:{self.nft}:{self.token}"
        cursor = ChainSyncCursor.objects.filter(key=key).first()
        start = options["from_block"] if options["from_block"] is not None else (cursor.next_block if cursor else None)
        if start is None:
            start = config("MUSIC_SYNC_START_BLOCK", default=None, cast=int)
        if start is None or start < 0:
            raise CommandError("Set MUSIC_SYNC_START_BLOCK (deployment block) or pass --from-block")
        head = int(self.rpc.call("eth_blockNumber", []), 16)
        end = min(options["to_block"] if options["to_block"] is not None else head - 3, head - 3)
        while start <= end:
            stop = min(start + 499, end)
            logs = self.rpc.call("eth_getLogs", [{"fromBlock": hex(start), "toBlock": hex(stop), "address": [self.nft, self.token]}])
            with transaction.atomic():
                self.process(logs)
                ChainSyncCursor.objects.update_or_create(
                    key=key, defaults={"next_block": max(stop + 1, cursor.next_block if cursor else 0)}
                )
            self.stdout.write(f"Synced blocks {start}–{stop} ({len(logs)} logs)")
            start = stop + 1

    def block_time(self, log):
        block = self.rpc.call("eth_getBlockByNumber", [log["blockNumber"], False])
        return datetime.fromtimestamp(int(block["timestamp"], 16), tz=utc_timezone.utc)

    def item(self, token_id, contract):
        item = NFTItem.objects.filter(contract_address__iexact=contract, token_id=token_id).first()
        if item:
            return item
        # itemDetails(uint256): original creator is word 1; category is word 0.
        selector = "0x" + keccak(b"itemDetails(uint256)")[:4].hex()
        result = self.rpc.call("eth_call", [{"to": contract, "data": selector + f"{token_id:064x}"}, "latest"])
        if not result or result == "0x":
            raise CommandError(f"NFT #{token_id} is absent from {contract}")
        creator = address(result[2 + 64:2 + 128])
        category = CATEGORIES[word(result, 0)]
        # A missing mint receipt can be backfilled from current on-chain state.
        uri_selector = "0x" + keccak(b"tokenURI(uint256)")[:4].hex()
        uri_result = self.rpc.call("eth_call", [{"to": contract, "data": uri_selector + f"{token_id:064x}"}, "latest"])
        uri = decode_string(uri_result)
        item, _ = NFTItem.objects.get_or_create(
            contract_address=contract, token_id=token_id,
            defaults={"title": uri or f"NFT #{token_id}", "metadata_uri": uri,
                      "category": category, "creator_wallet": creator,
                      "creator": account(creator)},
        )
        return item

    def wallet_tx(self, wallet, tx_hash, kind, value, currency, to=""):
        user = account(wallet)
        if user is not None:
            WalletTransaction.objects.get_or_create(
                user=user, tx_hash=tx_hash, tx_type=kind,
                defaults={"amount": amount(value), "currency": currency, "status": "CONFIRMED",
                          "from_address": wallet, "to_address": to},
            )

    def process(self, logs):
        for log in sorted(logs, key=lambda entry: (int(entry["blockNumber"], 16), int(entry["logIndex"], 16))):
            contract = log["address"].lower()
            if contract not in (self.nft, self.token) or not log["topics"]:
                continue
            kind = EVENTS.get(log["topics"][0].lower())
            if kind is None or (contract == self.nft) != (kind in ("mint", "list", "cancel", "buy", "transfer")):
                continue
            if log.get("removed"):
                continue
            topics, data = log["topics"], log["data"]
            tx_hash = log["transactionHash"].lower()
            event_key = f"{tx_hash}:{int(log['logIndex'], 16)}"
            if ChainEvent.objects.filter(key=event_key).exists():
                continue
            if kind in ("mint", "list", "cancel", "buy"):
                token_id = int(topics[1], 16)
                item = self.item(token_id, contract)
                if kind == "mint":
                    creator, owner = address(topics[2]), address(topics[3])
                    item.creator_wallet, item.owner_wallet = creator, owner
                    item.creator, item.current_owner = account(creator), account(owner)
                    item.royalty_receiver = address(data[2 + 64:2 + 128])
                    item.royalty_percentage = Decimal(word(data, 2)) / 100
                    item.tx_hash = tx_hash
                    item.save()
                elif kind == "list":
                    seller, price = address(topics[2]), amount(word(data, 0))
                    if not NFTListing.objects.filter(item=item, listing_tx_hash=tx_hash).exists():
                        # A purchase may have been backfilled from its receipt first.
                        sold = NFTListing.objects.filter(
                            item=item, seller_wallet__iexact=seller,
                            listing_tx_hash="", is_active=False, tx_hash__startswith="0x",
                        ).order_by("-sold_at").first()
                        if sold:
                            sold.listing_tx_hash = tx_hash
                            sold.save(update_fields=["listing_tx_hash"])
                        else:
                            NFTListing.objects.create(
                                item=item, listing_tx_hash=tx_hash, seller=account(seller),
                                seller_wallet=seller, price=price, currency="POL", is_active=True,
                            )
                elif kind == "cancel":
                    NFTListing.objects.filter(item=item, seller_wallet__iexact=address(topics[2]), is_active=True).update(is_active=False)
                elif kind == "buy":
                    seller, buyer = address(topics[2]), address(topics[3])
                    price, royalty_raw = word(data, 0), word(data, 2)
                    receiver = address(data[2 + 64:2 + 128])
                    listing = NFTListing.objects.filter(item=item, tx_hash__iexact=tx_hash).first()
                    if listing is None:
                        listing = NFTListing.objects.filter(item=item, seller_wallet__iexact=seller, is_active=True).order_by("-created_at").first()
                    NFTListing.objects.filter(item=item, is_active=True).update(is_active=False)
                    if listing is None:
                        listing = NFTListing(item=item, seller_wallet=seller, seller=account(seller), listing_tx_hash="")
                    listing.price, listing.currency = amount(price), "POL"
                    listing.seller_wallet, listing.buyer_wallet = seller, buyer
                    listing.seller, listing.buyer = account(seller), account(buyer)
                    listing.tx_hash, listing.sold_at, listing.is_active = tx_hash, self.block_time(log), False
                    listing.save()
                    item.owner_wallet, item.current_owner = buyer, account(buyer)
                    item.royalty_receiver = receiver
                    if price:
                        item.royalty_percentage = Decimal(royalty_raw) * 100 / Decimal(price)
                    item.save()
                    self.wallet_tx(buyer, tx_hash, "NFT_PURCHASE", price, "POL", seller)
                    if royalty_raw and receiver != seller and receiver != "0x" + "0" * 40:
                        OnchainNFTRoyalty.objects.get_or_create(
                            tx_hash=tx_hash, defaults={"contract_address": contract,
                                                      "token_id": token_id, "receiver_wallet": receiver,
                                                      "amount": amount(royalty_raw)},
                        )
                ChainEvent.objects.create(key=event_key)
                continue
            if kind == "transfer":
                token_id = int(topics[3], 16)
                item = self.item(token_id, contract)
                owner = address(topics[2])
                item.owner_wallet, item.current_owner = owner, account(owner)
                item.save(update_fields=["owner_wallet", "current_owner", "updated_at"])
                ChainEvent.objects.create(key=event_key)
                continue
            wallet, position_id = address(topics[1]), int(topics[2], 16)
            if kind == "stake":
                stake_amount, seconds, rate = (word(data, i) for i in range(3))
                started = self.block_time(log)
                StakingRecord.objects.update_or_create(
                    wallet_address=wallet, position_id=position_id,
                    defaults={"user": account(wallet), "amount": amount(stake_amount),
                              "lock_duration_days": seconds // 86400, "reward_rate_bps": rate,
                              "start_time": started, "end_time": started + timedelta(seconds=seconds), "is_active": True},
                )
                self.wallet_tx(wallet, tx_hash, "STAKE", stake_amount, "MUSIC", contract)
            elif kind == "unstake":
                StakingRecord.objects.filter(wallet_address__iexact=wallet, position_id=position_id).update(is_active=False)
                self.wallet_tx(wallet, tx_hash, "UNSTAKE", word(data, 0), "MUSIC", wallet)
            elif kind == "claim":
                reward = word(data, 0)
                record = StakingRecord.objects.filter(wallet_address__iexact=wallet, position_id=position_id).first()
                if record and not WalletTransaction.objects.filter(tx_hash__iexact=tx_hash, tx_type="REWARD_CLAIM").exists():
                    record.claimed_reward += amount(reward)
                    record.save(update_fields=["claimed_reward"])
                self.wallet_tx(wallet, tx_hash, "REWARD_CLAIM", reward, "MUSIC", wallet)
            ChainEvent.objects.create(key=event_key)
