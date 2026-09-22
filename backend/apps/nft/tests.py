from django.test import TestCase
from apps.users.models import User
from apps.nft.models import NFTItem, NFTListing


class NFTModelTests(TestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            email="artist@musiccoin.io",
            password="securePassword123!",
            role=User.Role.ARTIST,
        )
        self.buyer = User.objects.create_user(
            email="collector@musiccoin.io",
            password="securePassword123!",
            role=User.Role.FAN,
        )

    def test_nft_creation_and_listing(self):
        item = NFTItem.objects.create(
            creator=self.creator,
            current_owner=self.creator,
            title="Genesis Track #01",
            metadata_uri="ipfs://QmXyz123",
            category=NFTItem.NFTCategory.SONG,
            royalty_percentage=10.00,
            token_id=1,
        )
        self.assertEqual(item.title, "Genesis Track #01")

        listing = NFTListing.objects.create(
            item=item,
            seller=self.creator,
            price=150.00,
            currency=NFTListing.Currency.MUSIC,
        )
        self.assertTrue(listing.is_active)
        self.assertEqual(listing.price, 150.00)
