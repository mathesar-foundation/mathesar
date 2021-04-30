from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from mathesar.models import Table, Schema
from mathesar.pagination import DefaultLimitOffsetPagination, TableLimitOffsetPagination
from mathesar.serializers import TableSerializer, SchemaSerializer, RecordSerializer


class SchemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
    pagination_class = DefaultLimitOffsetPagination


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination


class RecordViewSet(viewsets.ViewSet):
    queryset = Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        paginator = TableLimitOffsetPagination()
        records = paginator.paginate_queryset(self.queryset, request, table_pk)
        serializer = RecordSerializer(records, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        record = table.get_record(pk)
        if not record:
            raise NotFound
        serializer = RecordSerializer(record)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = Table.objects.get(id=table_pk)
        # We only support adding a single record through the API.
        assert type(request.data) is dict
        record = table.create_records(request.data)
        serializer = RecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None, table_pk=None):
        table = Table.objects.get(id=table_pk)
        table.delete_record(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
