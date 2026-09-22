from django.test import TestCase
from django.utils import timezone
from apps.users.models import User
from apps.wallet.models import WalletTransaction, StakingRecord


class WalletModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="staker@musiccoin.io",
            password="securePassword123!",
            role=User.Role.FAN,
        )

    def test_staking_record_and_transaction(self):
        now = timezone.now()
        stake = StakingRecord.objects.create(
            user=self.user,
            position_id=0,
            amount=500.00,
            lock_duration_days=30,
            reward_rate_bps=500,
            start_time=now,
            end_time=now + timezone.timedelta(days=30),
            is_active=True,
        )
        self.assertTrue(stake.is_active)
        self.assertEqual(stake.amount, 500.00)

        tx = WalletTransaction.objects.create(
            user=self.user,
            tx_hash="0x123abc",
            tx_type=WalletTransaction.TransactionType.STAKE,
            amount=500.00,
            currency="MUSIC",
            status=WalletTransaction.TransactionStatus.CONFIRMED,
        )
        self.assertEqual(tx.status, WalletTransaction.TransactionStatus.CONFIRMED)
