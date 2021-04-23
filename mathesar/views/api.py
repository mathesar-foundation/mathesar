from rest_framework import viewsets

from mathesar.models import Table, Schema
from mathesar.serializers import TableSerializer, SchemaSerializer


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer


class SchemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schema.objects.all().order_by('-created_at')
    serializer_class = SchemaSerializer
