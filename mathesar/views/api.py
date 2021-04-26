from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.models import Table, Schema
from mathesar.serializers import TableSerializer, SchemaSerializer, RecordSerializer


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer

    @action(detail=True)
    def records(self, request, pk=None):
        table = self.get_object()
        serializer = RecordSerializer(table.sa_records, many=True)
        return Response(serializer.data)


class SchemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
