from django.urls import path

from .views import (
    AdminTransactionHistoryView,
    StakingListView,
    TransactionHistoryView,
)


urlpatterns = [
    path(
        "transactions/",
        TransactionHistoryView.as_view(),
        name="wallet-transactions",
    ),

    path(
        "admin/transactions/",
        AdminTransactionHistoryView.as_view(),
        name="admin-wallet-transactions",
    ),

    path(
        "staking/",
        StakingListView.as_view(),
        name="wallet-staking",
    ),
]