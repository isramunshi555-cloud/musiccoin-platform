from rest_framework.permissions import BasePermission


class IsArtist(BasePermission):
    message = "Only users with the Artist role can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ARTIST"
        )