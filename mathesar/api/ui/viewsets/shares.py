from rest_framework import viewsets
from rest_access_policy import AccessViewSetMixin

from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.serializers.shares import SharedTableSerializer, SharedQuerySerializer
from mathesar.api.ui.permissions.shares import SharedTableAccessPolicy, SharedQueryAccessPolicy
from mathesar.models.shares import SharedTable, SharedQuery


class SharedTableViewSet(AccessViewSetMixin, viewsets.ModelViewSet):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedTableSerializer
    access_policy = SharedTableAccessPolicy

    def get_queryset(self):
        return SharedTable.objects.filter(table_id=self.kwargs['table_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(table_id=self.kwargs['table_pk'])


class SharedQueryViewSet(viewsets.ModelViewSet):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedQuerySerializer
    access_policy = SharedQueryAccessPolicy

    def get_queryset(self):
        return SharedQuery.objects.filter(query_id=self.kwargs['query_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(query_id=self.kwargs['query_pk'])
