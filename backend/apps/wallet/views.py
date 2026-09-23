from rest_framework import generics, permissions

from .models import (
    StakingRecord,
    WalletTransaction,
)

from .serializers import (
    StakingRecordSerializer,
    WalletTransactionSerializer,
)


class TransactionHistoryView(
    generics.ListCreateAPIView
):
    """
    Normal authenticated users can:

    GET:
        View only their own wallet transactions.

    POST:
        Record one of their own blockchain transactions.
    """

    permission_classes = [
        permissions.IsAuthenticated
    ]

    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        return (
            WalletTransaction.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )


class AdminTransactionHistoryView(
    generics.ListAPIView
):
    """
    Django staff/admin users can see
    transactions from every MusicCoin user.
    """

    permission_classes = [
        permissions.IsAdminUser
    ]

    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        return (
            WalletTransaction.objects
            .select_related("user")
            .all()
            .order_by("-created_at")
        )


class StakingListView(
    generics.ListCreateAPIView
):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    serializer_class = StakingRecordSerializer

    def get_queryset(self):
        return (
            StakingRecord.objects
            .filter(user=self.request.user)
            .order_by("-start_time")
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )