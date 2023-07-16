from rest_framework import viewsets

from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.serializers.shares import SharedTableSerializer, SharedQuerySerializer
from mathesar.api.utils import get_table_or_404, get_query_or_404
from mathesar.models.shares import SharedTable, SharedQuery


class SharedTableViewSet(viewsets.ModelViewSet):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedTableSerializer

    def get_queryset(self):
        return SharedTable.objects.filter(table_id=self.kwargs['table_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        table_id=self.kwargs['table_pk']
        table = get_table_or_404(table_id)
        serializer.save(table=table)


class SharedQueryViewSet(viewsets.ModelViewSet):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedQuerySerializer

    def get_queryset(self):
        return SharedQuery.objects.filter(query_id=self.kwargs['query_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        query_id=self.kwargs['query_pk']
        query = get_query_or_404(query_id)
        serializer.save(query=query)
