from django_filters import BooleanFilter, DateTimeFromToRangeFilter
from django_property_filter import PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter, PropertyOrderingFilter

from mathesar.models.deprecated import Schema, Table, DataFile
from mathesar.models.query import Exploration


class CharInFilter(PropertyBaseInFilter, PropertyCharFilter):
    pass


class DataFileFilter(PropertyFilterSet):
    database = CharInFilter(field_name='table_imported_to__schema__database__name', lookup_expr='in')
    name = CharInFilter(field_name='name', lookup_expr='in')

    sort_by = PropertyOrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
        ),
        label="Sort By",
    )

    class Meta:
        model = DataFile
        fields = ['name']


class SchemaFilter(PropertyFilterSet):
    database = CharInFilter(field_name='database__name', lookup_expr='in')
    name = CharInFilter(field_name='name', lookup_expr='in')

    sort_by = PropertyOrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
        ),
        label="Sort By",
    )

    class Meta:
        model = Schema
        fields = ['name']
