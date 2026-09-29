from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.nft.models import NFTItem, NFTListing
from apps.wallet.models import StakingRecord

from .models import User


class WalletLinkPersistenceTests(TestCase):
    def test_linking_wallet_backfills_chain_records(self):
        wallet = "0x" + "ab" * 20
        item = NFTItem.objects.create(
            title="Chain NFT", metadata_uri="ipfs://test", token_id=9,
            creator_wallet=wallet.lower(), owner_wallet=wallet.lower(),
        )
        listing = NFTListing.objects.create(
            item=item, seller_wallet=wallet.lower(), buyer_wallet=wallet.lower(),
            price=Decimal("1"), is_active=False,
        )
        now = timezone.now()
        stake = StakingRecord.objects.create(
            wallet_address=wallet.lower(), position_id=0, amount=Decimal("1"),
            start_time=now, end_time=now + timedelta(days=30),
        )

        user = User.objects.create_user(email="wallet@example.com", password="test")
        user.wallet_address = wallet.upper().replace("0X", "0x")
        user.save(update_fields=["wallet_address"])

        item.refresh_from_db()
        listing.refresh_from_db()
        stake.refresh_from_db()
        self.assertEqual(item.creator, user)
        self.assertEqual(item.current_owner, user)
        self.assertEqual(listing.seller, user)
        self.assertEqual(listing.buyer, user)
        self.assertEqual(stake.user, user)
