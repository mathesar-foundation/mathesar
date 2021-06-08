from django_filters import rest_framework as filters

from mathesar.models import Table


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


class TableFilter(filters.FilterSet):
    name = CharInFilter(field_name='name', lookup_expr='in')

    class Meta:
        model = Table
        fields = ['name']
