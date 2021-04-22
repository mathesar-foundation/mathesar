from rest_framework import viewsets

from mathesar.models import Table
from mathesar.serializers import TableSerializer


class TableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer
