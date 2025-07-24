from rest_framework import permissions

class IsAdminEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        print(f"User: {user}, Authenticated: {user.is_authenticated}, Role: {getattr(user, 'role', None)}")
        return user.is_authenticated and hasattr(user, 'role') and user.role == 'admin'


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser