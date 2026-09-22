from django.urls import path
from .views import (
    RoyaltySplitListCreateView,
    RoyaltySplitDetailView,
    RoyaltyPayoutHistoryView,
)

urlpatterns = [
    path("splits/", RoyaltySplitListCreateView.as_view(), name="royalty-split-list-create"),
    path("splits/<int:pk>/", RoyaltySplitDetailView.as_view(), name="royalty-split-detail"),
    path("payouts/", RoyaltyPayoutHistoryView.as_view(), name="royalty-payout-history"),
]
