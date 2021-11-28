from django_filters import BooleanFilter, DateTimeFromToRangeFilter, OrderingFilter
from django_property_filter import PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter, PropertyOrderingFilter

from mathesar.database.types import MathesarTypeIdentifier, is_mathesar_type_comparable
from mathesar.models import Schema, Table, Database

from db.filters.base import (
    Predicate, all_predicates, takes_parameter_thats_mathesar_type, predicates_that_dont_need_comparability
)
from typing import List, Type


# TODO consider turning this spec into a class
def get_spec_for_predicate_and_MA_type(predicate_subclass: Type[Predicate], ma_type: MathesarTypeIdentifier) -> dict:
    spec = {
        'name': predicate_subclass.type.value,
        'position': predicate_subclass.super_type.value,
        'parameter_count': predicate_subclass.parameter_count.value,
    }
    if takes_parameter_thats_mathesar_type(predicate_subclass):
        spec['parameter_mathesar_type'] = ma_type.value
    return spec


def get_specs_for_MA_type(ma_type: MathesarTypeIdentifier) -> List[dict]:
    comparable = is_mathesar_type_comparable(ma_type)
    supported_predicate_set = all_predicates if comparable else predicates_that_dont_need_comparability
    return [
        get_spec_for_predicate_and_MA_type(predicate, ma_type)
        for predicate in supported_predicate_set
    ]

FILTER_OPTIONS_BY_MATHESAR_TYPE_IDENTIFIER = {
    ma_type.value: get_specs_for_MA_type(ma_type) for ma_type in MathesarTypeIdentifier
}


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
