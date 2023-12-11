from django_filters import rest_framework as filters
from rest_access_policy import AccessViewSetMixin
from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.ui.permissions.ui_database import UIDatabaseAccessPolicy
from mathesar.models.base import Database
from mathesar.api.dj_filters import DatabaseFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination

from mathesar.api.serializers.databases import ConnectionSerializer, TypeSerializer
from mathesar.api.serializers.filters import FilterSerializer

from mathesar.filters.base import get_available_filters
from mathesar.utils.connections import (
    copy_connection_from_preexisting, create_connection_from_scratch,
    create_connection_with_new_user
)


class ConnectionViewSet(
        AccessViewSetMixin,
        ListModelMixin, RetrieveModelMixin,
        viewsets.GenericViewSet,
):
    serializer_class = ConnectionSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DatabaseFilter
    access_policy = UIDatabaseAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request,
            Database.objects.all().order_by('-created_at')
        )

    @action(methods=['get'], detail=True)
    def types(self, request, pk=None):
        database = self.get_object()
        supported_ui_types = database.supported_ui_types
        serializer = TypeSerializer(supported_ui_types, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=True)
    def filters(self, request, pk=None):
        database = self.get_object()
        engine = database._sa_engine
        available_filters = get_available_filters(engine)
        serializer = FilterSerializer(available_filters, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=False, serializer_class=serializers.Serializer)
    def create_from_known_connection(self, request):
        created_connection = copy_connection_from_preexisting(
            request.data['credentials']['connection'],
            request.data['nickname'],
            request.data['database_name'],
            request.data.get('create_database', False),
            request.data.get('sample_data', []),
        )
        serializer = ConnectionSerializer(
            created_connection, context={'request': request}, many=False
        )
        return Response(serializer.data)

    @action(methods=['post'], detail=False, serializer_class=serializers.Serializer)
    def create_from_scratch(self, request):
        credentials = request.data['credentials']
        created_connection = create_connection_from_scratch(
            credentials['user'],
            credentials['password'],
            credentials['host'],
            credentials['port'],
            request.data['nickname'],
            request.data['database_name'],
            request.data.get('sample_data', []),
        )
        serializer = ConnectionSerializer(
            created_connection, context={'request': request}, many=False
        )
        return Response(serializer.data)

    @action(methods=['post'], detail=False, serializer_class=serializers.Serializer)
    def create_with_new_user(self, request):
        credentials = request.data['credentials']
        created_connection = create_connection_with_new_user(
            credentials['create_user_via'],
            credentials['user'],
            credentials['password'],
            request.data['nickname'],
            request.data['database_name'],
            request.data.get('create_database', False),
            request.data.get('sample_data', []),
        )
        serializer = ConnectionSerializer(
            created_connection, context={'request': request}, many=False
        )
        return Response(serializer.data)
