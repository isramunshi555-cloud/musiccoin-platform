from rest_framework import generics, permissions
from .models import RoyaltySplitConfig, RoyaltyPayout
from .serializers import (
    RoyaltySplitConfigSerializer,
    CreateRoyaltySplitSerializer,
    RoyaltyPayoutSerializer,
)


class RoyaltySplitListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateRoyaltySplitSerializer
        return RoyaltySplitConfigSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return RoyaltySplitConfig.objects.all().prefetch_related("recipients", "payouts")
        return RoyaltySplitConfig.objects.filter(
            created_by=user
        ).prefetch_related("recipients", "payouts")


class RoyaltySplitDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoyaltySplitConfigSerializer
    queryset = RoyaltySplitConfig.objects.all().prefetch_related("recipients", "payouts")


class RoyaltyPayoutHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoyaltyPayoutSerializer

    def get_queryset(self):
        return RoyaltyPayout.objects.all().select_related("recipient", "split")
