from rest_access_policy import AccessViewSetMixin
from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed

from mathesar.api.ui.permissions.database_role import DatabaseRoleAccessPolicy
from mathesar.api.ui.serializers.users import UserSerializer, DatabaseRoleSerializer, SchemaRoleSerializer
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.permissions.users import UserAccessPolicy
from mathesar.models.users import User, DatabaseRole, SchemaRole


class UserViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = UserAccessPolicy


class DatabaseRoleViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    queryset = DatabaseRole.objects.all().order_by('id')
    serializer_class = DatabaseRoleSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = DatabaseRoleAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request, super().get_queryset()
        )

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)


class SchemaRoleViewSet(viewsets.ModelViewSet):
    queryset = SchemaRole.objects.all().order_by('id')
    serializer_class = SchemaRoleSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = DatabaseRoleAccessPolicy

    def update(self, request, pk=None):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, pk=None):
        raise MethodNotAllowed(request.method)
