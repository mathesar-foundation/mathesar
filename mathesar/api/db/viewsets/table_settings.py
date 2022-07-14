from rest_framework.viewsets import ModelViewSet
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.table_settings import TableSettingsSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models.base import TableSettings


class TableSettingsViewSet(ModelViewSet):
    serializer_class = TableSettingsSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return TableSettings.objects.filter(table=self.kwargs['table_pk'])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['table'] = get_table_or_404(self.kwargs['table_pk'])

        return context
