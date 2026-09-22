from rest_framework import serializers
from .models import NFTItem, NFTListing


class NFTItemSerializer(serializers.ModelSerializer):
    creator_email = serializers.EmailField(source="creator.email", read_only=True)
    owner_email = serializers.EmailField(source="current_owner.email", read_only=True)
    active_listing = serializers.SerializerMethodField()

    class Meta:
        model = NFTItem
        fields = [
            "id",
            "creator_email",
            "owner_email",
            "title",
            "description",
            "category",
            "token_id",
            "contract_address",
            "metadata_uri",
            "image_url",
            "audio_url",
            "royalty_percentage",
            "royalty_receiver",
            "tx_hash",
            "active_listing",
            "created_at",
        ]
        read_only_fields = ["id", "creator_email", "owner_email", "created_at"]

    def get_active_listing(self, obj):
        listing = obj.listings.filter(is_active=True).first()
        if listing:
            return {
                "id": listing.id,
                "price": str(listing.price),
                "currency": listing.currency,
                "listing_type": listing.listing_type,
            }
        return None


class NFTListingSerializer(serializers.ModelSerializer):
    item = NFTItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=NFTItem.objects.all(), source="item", write_only=True
    )
    seller_email = serializers.EmailField(source="seller.email", read_only=True)

    class Meta:
        model = NFTListing
        fields = [
            "id",
            "item",
            "item_id",
            "seller_email",
            "listing_type",
            "price",
            "currency",
            "is_active",
            "sold_at",
            "created_at",
        ]
        read_only_fields = ["id", "seller_email", "is_active", "sold_at", "created_at"]
