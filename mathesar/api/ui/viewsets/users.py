from rest_access_policy import AccessPolicy, AccessViewSetMixin
from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed

from mathesar.api.serializers.users import UserSerializer, DatabaseRoleSerializer, SchemaRoleSerializer
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.models.users import User, DatabaseRole, SchemaRole


class UserAccessPolicy(AccessPolicy):
    statements = [
        # Anyone can read all users
        {
            "action": ["list", "retrieve"],
            "principal": "*",
            "effect": "allow"
        },
        # Only superusers can create users
        {
            "action": ["create"],
            "principal": ["*"],
            "effect": "allow",
            "condition": "is_superuser"
        },
        # Users can edit and delete themselves
        # Superusers can also edit and delete users
        {
            "action": ["destroy", "partial_update", "update"],
            "principal": ["*"],
            "effect": "allow",
            "condition_expression": ["(is_superuser or is_self)"]
        },
    ]

    def is_superuser(self, request, view, action):
        return request.user.is_superuser

    def is_self(self, request, view, action):
        user = view.get_object()
        return request.user == user


class UserViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = UserAccessPolicy


class DatabaseRoleViewSet(viewsets.ModelViewSet):
    queryset = DatabaseRole.objects.all().order_by('id')
    serializer_class = DatabaseRoleSerializer
    pagination_class = DefaultLimitOffsetPagination

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)


class SchemaRoleViewSet(viewsets.ModelViewSet):
    queryset = SchemaRole.objects.all().order_by('id')
    serializer_class = SchemaRoleSerializer
    pagination_class = DefaultLimitOffsetPagination

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)
