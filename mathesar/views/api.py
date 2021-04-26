from rest_framework import viewsets
from rest_framework.response import Response

from mathesar.models import Table, Schema
from mathesar.pagination import DefaultLimitOffsetPagination, TableLimitOffsetPagination
from mathesar.serializers import TableSerializer, SchemaSerializer, RecordSerializer


class RecordViewSet(viewsets.GenericViewSet):
    queryset = Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        paginator = TableLimitOffsetPagination()
        records = paginator.paginate_queryset(self.queryset, request, table_pk)
        serializer = RecordSerializer(records, many=True)
        return paginator.get_paginated_response(serializer.data)


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination


class SchemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination
