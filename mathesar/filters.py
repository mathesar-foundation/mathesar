from django_filters import rest_framework as filters

from mathesar.models import Schema, Table


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


class SchemaFilter(filters.FilterSet):
    name = CharInFilter(field_name='name', lookup_expr='in')
    database = CharInFilter(field_name='database', lookup_expr='in')

    class Meta:
        model = Schema
        fields = ['name', 'database']


class TableFilter(filters.FilterSet):
    name = CharInFilter(field_name='name', lookup_expr='in')

    class Meta:
        model = Table
        fields = ['name']
