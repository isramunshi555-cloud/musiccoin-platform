"""Attach verified chain records when an account is assigned a wallet."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def link_existing_wallet_records(sender, instance, **kwargs):
    update_fields = kwargs.get("update_fields")
    if update_fields is not None and "wallet_address" not in update_fields:
        return
    wallet = (instance.wallet_address or "").strip()
    if not wallet:
        return

    from apps.nft.models import NFTItem, NFTListing
    from apps.wallet.models import StakingRecord

    NFTItem.objects.filter(
        creator_wallet__iexact=wallet, creator__isnull=True
    ).update(creator=instance)
    NFTItem.objects.filter(
        owner_wallet__iexact=wallet, current_owner__isnull=True
    ).update(current_owner=instance)
    NFTListing.objects.filter(
        seller_wallet__iexact=wallet, seller__isnull=True
    ).update(seller=instance)
    NFTListing.objects.filter(
        buyer_wallet__iexact=wallet, buyer__isnull=True
    ).update(buyer=instance)
    StakingRecord.objects.filter(
        wallet_address__iexact=wallet, user__isnull=True
    ).update(user=instance)
