from django_property_filter import (
    PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter,
)

from mathesar.models import Schema, Table


class CharInFilter(PropertyBaseInFilter, PropertyCharFilter):
    pass


class SchemaFilter(PropertyFilterSet):
    database = CharInFilter(field_name='database', lookup_expr='in')
    name = CharInFilter(field_name='name', lookup_expr='in')

    class Meta:
        model = Schema
        fields = ['database', 'name']


class TableFilter(PropertyFilterSet):
    name = CharInFilter(field_name='name', lookup_expr='in')

    class Meta:
        model = Table
        fields = ['name']
