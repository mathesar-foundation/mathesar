from rest_framework import viewsets
from rest_framework.response import Response

from mathesar.models import Table, Schema
from mathesar.serializers import TableSerializer, SchemaSerializer, RecordSerializer


class RecordViewSet(viewsets.GenericViewSet):
    queryset = Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        table = self.queryset.get(id=table_pk)
        serializer = RecordSerializer(table.sa_all_records, many=True)
        return Response(serializer.data)


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer


class SchemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
