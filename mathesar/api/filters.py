from dataclasses import fields as dataclass_fields
from typing import Optional, Type

from django_filters import BooleanFilter, DateTimeFromToRangeFilter, OrderingFilter
from django_property_filter import PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter, PropertyOrderingFilter

from db.filters.base import all_predicates, Predicate, ReliesOnLike

from mathesar.database.types import is_ma_type_supported_by_predicate
from mathesar.models import Schema, Table, Database
from mathesar.database.types import MathesarTypeIdentifier


# TODO move to other namespace?
def get_filter_options_for_database(database):
    supported_ma_types = [
        MathesarTypeIdentifier(ma_type_info['identifier'])
        for ma_type_info in database.supported_types
    ]
    return [
        {
            "identifier": predicate.type.value,
            "name": predicate.name,
            "position": predicate.super_type.value,
            "parameter_count": predicate.parameter_count.value,
            "ma_types": [
                ma_type.value
                for ma_type in supported_ma_types
                if is_ma_type_supported_by_predicate(ma_type, predicate)
            ],
            "settings": _get_settings_for_predicate(predicate),
        } for predicate in all_predicates
    ]


def _get_type_name(type) -> str:
    return type.__name__


def _get_settings_for_predicate(predicate_class: Type[Predicate]) -> Optional[dict]:
    if issubclass(predicate_class, ReliesOnLike):
        case_sensitive_field = tuple(
            field
            for field in dataclass_fields(predicate_class)
            if field.name == "case_sensitive"
        )[0]
        return {
            case_sensitive_field.name: {
                "default": case_sensitive_field.default,
                "type": _get_type_name(case_sensitive_field.type),
            }
        }
    else:
        return None


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
