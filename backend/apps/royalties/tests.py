from django.test import TestCase
from apps.users.models import User
from apps.royalties.models import RoyaltySplitConfig, RoyaltyRecipient, RoyaltyPayout


class RoyaltyModelTests(TestCase):
    def setUp(self):
        self.artist = User.objects.create_user(
            email="artist@festival.com",
            password="securePassword123!",
            role=User.Role.ARTIST,
        )

    def test_royalty_split_and_payout(self):
        split = RoyaltySplitConfig.objects.create(
            split_id="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            title="Cyberbeats 2026 Revenue Split",
            created_by=self.artist,
            total_shares=100,
        )
        self.assertEqual(split.title, "Cyberbeats 2026 Revenue Split")

        recipient = RoyaltyRecipient.objects.create(
            split=split,
            user=self.artist,
            wallet_address="0x1234567890123456789012345678901234567890",
            role_name="Lead DJ",
            share_percentage=60.00,
        )
        self.assertEqual(recipient.share_percentage, 60.00)

        payout = RoyaltyPayout.objects.create(
            split=split,
            recipient=recipient,
            amount=6.000000,
            currency="POL",
            tx_hash="0x9999",
        )
        self.assertEqual(payout.amount, 6.000000)
