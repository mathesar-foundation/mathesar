from django_property_filter import (
    PropertyFilterSet, PropertyBaseInFilter, PropertyCharFilter,
    PropertyOrderingFilter
)

from mathesar.models.deprecated import DataFile


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
