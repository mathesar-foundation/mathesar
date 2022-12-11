from django_filters import rest_framework as filters
from rest_access_policy import AccessViewSetMixin
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.models.base import Database
from mathesar.api.dj_filters import DatabaseFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination

from mathesar.api.serializers.databases import DatabaseSerializer

from db.functions.operations.check_support import get_supported_db_functions
from mathesar.api.serializers.functions import DBFunctionSerializer

from db.types.base import get_available_known_db_types
from mathesar.api.serializers.db_types import DBTypeSerializer


class DatabaseViewSet(AccessViewSetMixin, viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = DatabaseSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter
    access_policy = DatabaseAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request,
            Database.objects.all().order_by('-created_at')
        )

    @action(methods=['get'], detail=True)
    def functions(self, request, pk=None):
        database = self.get_object()
        engine = database._sa_engine
        supported_db_functions = get_supported_db_functions(engine)
        serializer = DBFunctionSerializer(supported_db_functions, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=True)
    def types(self, request, pk=None):
        database = self.get_object()
        engine = database._sa_engine
        available_known_db_types = get_available_known_db_types(engine)
        serializer = DBTypeSerializer(available_known_db_types, many=True)
        return Response(serializer.data)
