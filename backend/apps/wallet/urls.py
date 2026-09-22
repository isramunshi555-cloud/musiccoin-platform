from django.urls import path
from .views import TransactionHistoryView, StakingListView

urlpatterns = [
    path("transactions/", TransactionHistoryView.as_view(), name="wallet-transactions"),
    path("staking/", StakingListView.as_view(), name="wallet-staking"),
]
