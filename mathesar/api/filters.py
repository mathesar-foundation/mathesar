from django_filters import BooleanFilter, DateTimeFromToRangeFilter, OrderingFilter
from django_property_filter import PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter, PropertyOrderingFilter

from db.filters.base import all_predicates

from mathesar.database.types import is_ma_type_supported_by_predicate
from mathesar.models import Schema, Table, Database


# TODO move to other namespace?
def get_filter_options(supported_ma_types):
    return [
        {
            "identifier": predicate.type.value,
            "name": predicate.name,
            "position": predicate.superType.value,
            "parameter_count": predicate.parameter_count.value,
            "ma_types": [
                ma_type.value
                for ma_type in supported_ma_types
                if is_ma_type_supported_by_predicate(ma_type, predicate)
            ]
        } for predicate in all_predicates
    ]


class CharInFilter(PropertyBaseInFilter, PropertyCharFilter):
    pass


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


class TableFilter(PropertyFilterSet):
    name = CharInFilter(field_name='name', lookup_expr='in')
    created = DateTimeFromToRangeFilter(field_name='created_at')
    updated = DateTimeFromToRangeFilter(field_name='updated_at')
    not_imported = BooleanFilter(lookup_expr="isnull", field_name='import_verified')

    sort_by = PropertyOrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
        ),
        label="Sort By",
    )

    class Meta:
        model = Table
        fields = ['name', 'schema', 'created_at', 'updated_at', 'import_verified']


class DatabaseFilter(PropertyFilterSet):
    sort_by = OrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
        ),
        label="Sort By",
    )

    class Meta:
        model = Database
        fields = ['deleted']
