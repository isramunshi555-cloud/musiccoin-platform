from unittest.mock import Mock
from decimal import Decimal

from django.test import TestCase
from apps.nft.management.commands.sync_musiccoin import Command, topic
from apps.nft.models import NFTItem, NFTListing
from apps.royalties.models import OnchainNFTRoyalty
from apps.users.models import User
from apps.wallet.models import StakingRecord


class VerifiedSaleSyncTests(TestCase):
    def test_sale_is_saved_once_and_preserves_unlinked_buyer_wallet(self):
        seller = "0x" + "ab" * 20
        buyer = "0x" + "cd" * 20
        token = "0x" + "12" * 20
        contract = "0x" + "34" * 20
        seller_user = User.objects.create_user(email="seller@example.org", password="test-password", wallet_address=seller)
        item = NFTItem.objects.create(
            creator=seller_user, current_owner=seller_user, creator_wallet=seller,
            owner_wallet=seller, token_id=2, contract_address=contract,
            metadata_uri="ipfs://test", title="Test NFT",
        )
        command = Command()
        command.nft, command.token = contract, token
        command.rpc = Mock()
        command.rpc.call.side_effect = lambda method, params: {"timestamp": hex(1_800_000_000 + int(params[0], 16))}
        command.item = Mock(return_value=item)
        tx = "0x" + "de" * 32
        padded = lambda wallet: "0x" + "0" * 24 + wallet[2:]
        listing = {
            "address": contract, "topics": [topic("NFTListed(uint256,address,uint256)"), hex(2), padded(seller)],
            "data": "0x" + f"{10**16:064x}", "transactionHash": "0x" + "ef" * 32,
            "blockNumber": "0x1", "logIndex": "0x0",
        }
        sale = {
            "address": contract,
            "topics": [topic("NFTPurchased(uint256,address,address,uint256,address,uint256)"), hex(2), padded(seller), padded(buyer)],
            "data": "0x" + f"{10**16:064x}" + seller[2:].rjust(64, "0") + f"{10**15:064x}",
            "transactionHash": tx, "blockNumber": "0x2", "logIndex": "0x0",
        }
        # Replay the sale receipt first, then scan historical listing blocks.
        command.process([sale])
        command.process([listing])
        command.process([listing, sale])
        mint = {
            "address": contract,
            "topics": [topic("MusicNFTMinted(uint256,address,address,string,address,uint96,uint8)"), hex(2), padded(seller), padded(seller)],
            "data": "0x" + f"{128:064x}" + seller[2:].rjust(64, "0") + f"{1000:064x}" + f"{0:064x}",
            "transactionHash": "0x" + "aa" * 32, "blockNumber": "0x0", "logIndex": "0x0",
        }
        command.process([mint])
        item.refresh_from_db()
        self.assertEqual(item.owner_wallet, buyer)
        self.assertIsNone(item.current_owner)
        self.assertEqual(NFTListing.objects.count(), 1)
        self.assertEqual(NFTListing.objects.get().buyer_wallet, buyer)
        self.assertFalse(NFTListing.objects.get().is_active)
        # The royalty receiver is also the seller, so the contract pays them
        # the full price. There is no separate royalty transfer to record.
        self.assertFalse(OnchainNFTRoyalty.objects.exists())

    def test_stake_and_reward_replay_cannot_double_count(self):
        wallet = "0x" + "ab" * 20
        contract = "0x" + "12" * 20
        command = Command()
        command.nft, command.token = "0x" + "34" * 20, contract
        command.rpc = Mock()
        command.rpc.call.return_value = {"timestamp": hex(1_800_000_000)}
        common = {"address": contract, "blockNumber": "0x1"}
        topics = lambda signature: [topic(signature), "0x" + "0" * 24 + wallet[2:], hex(0)]
        stake = {**common, "topics": topics("Staked(address,uint256,uint256,uint256,uint256)"),
                 "data": "0x" + f"{10**18:064x}" + f"{30 * 86400:064x}" + f"{500:064x}",
                 "logIndex": "0x0", "transactionHash": "0x" + "cd" * 32}
        claim = {**common, "topics": topics("RewardClaimed(address,uint256,uint256)"),
                 "data": "0x" + f"{10**16:064x}",
                 "logIndex": "0x0", "transactionHash": "0x" + "ef" * 32}
        command.process([stake, claim])
        command.process([stake, claim])
        record = StakingRecord.objects.get()
        self.assertEqual(record.wallet_address, wallet)
        self.assertEqual(record.amount, 1)
        self.assertEqual(record.claimed_reward, Decimal("0.01"))
