from rest_framework import generics, permissions
from .models import WalletTransaction, StakingRecord
from .serializers import WalletTransactionSerializer, StakingRecordSerializer


class TransactionHistoryView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StakingListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StakingRecordSerializer

    def get_queryset(self):
        return StakingRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
