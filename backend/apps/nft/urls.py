from django.urls import path
from .views import (
    NFTItemListCreateView,
    NFTItemDetailView,
    MarketplaceListingListView,
    BuyNFTView,
)

urlpatterns = [
    path("items/", NFTItemListCreateView.as_view(), name="nft-item-list-create"),
    path("items/<int:pk>/", NFTItemDetailView.as_view(), name="nft-item-detail"),
    path("marketplace/", MarketplaceListingListView.as_view(), name="marketplace-listings"),
    path("marketplace/<int:pk>/buy/", BuyNFTView.as_view(), name="buy-nft"),
]
