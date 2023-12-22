from rest_access_policy import AccessViewSetMixin
from rest_framework.viewsets import ModelViewSet

from mathesar.api.ui.permissions.column_settings import ColumnSettingAccessPolicy
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.serializers.column_settings import ColumnSettingsSerializer
from mathesar.models.base import ColumnSetting


class ColumnSettingsViewSet(AccessViewSetMixin, ModelViewSet):
    serializer_class = ColumnSettingsSerializer
    pagination_class = DefaultLimitOffsetPagination
    access_policy = ColumnSettingAccessPolicy

    def get_queryset(self):
        return self.access_policy.scope_queryset(
            self.request,
            ColumnSetting.objects.filter(column=self.kwargs['column_pk'])
        )
