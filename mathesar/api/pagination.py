import copy
from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from db.records.operations.group import GroupBy
from mathesar.api.utils import get_table_or_404, process_annotated_records
from mathesar.models import Column


class DefaultLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 500

    def get_paginated_response(self, data):
        return Response(
            OrderedDict(
                [
                    ('count', self.count),
                    ('results', data)
                ]
            )
        )


class ColumnLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        table = get_table_or_404(pk=table_id)
        self.count = len(table.sa_columns)
        self.request = request
        return list(table.sa_columns)[self.offset:self.offset + self.limit]


class TableLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(
            self, queryset, request, table_id, filters=[], order_by=[], group_by=None,
    ):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        # TODO: Cache count value somewhere, since calculating it is expensive.
        table = get_table_or_404(pk=table_id)
        self.count = table.sa_num_records(filters=filters)
        self.request = request

        return table.get_records(
            self.limit,
            self.offset,
            filters=filters,
            order_by=order_by,
            group_by=group_by,
        )


class TableLimitOffsetGroupPagination(TableLimitOffsetPagination):
    def get_paginated_response(self, data):
        return Response(
            OrderedDict(
                [
                    ('count', self.count),
                    ('grouping', self.grouping),
                    ('results', data)
                ]
            )
        )

    def _iterate_filter_tree_and_apply_field_function(self, obj, field_function):
        """
        Recursively loop and get to the last child object which contains the `field` property
         and apply the `field_function`
        """
        if type(obj) == list:
            for filter_object in obj:
                self._iterate_filter_tree_and_apply_field_function(filter_object, field_function)
        elif type(obj) == dict:
            if 'field' in obj.keys():
                field_function(obj)
            else:
                for operator, filter_object in obj.items():
                    self._iterate_filter_tree_and_apply_field_function(filter_object, field_function)

    def _extract_field_names(self, field_names):
        def append_to_field_names(filter_obj):
            if filter_obj['op'] == 'get_duplicates':
                field_names.update(filter_obj['value'])
            else:
                field_names.add(filter_obj['field'])

        return append_to_field_names

    def _convert_filter_field_id_to_name(self, column_map):
        def convert_filter_field_ids(filter_obj):
            # Duplicates filter is a peculiar filter which does not contain a field property,
            # rather the `value` property contains the column id which we need to convert to a column name
            if filter_obj['op'] == 'get_duplicates':
                filter_obj['value'] = [column_map[field_id].name for field_id in filter_obj['value']]
            else:
                field_id = filter_obj['field']
                filter_obj['field'] = column_map[field_id].name

        return convert_filter_field_ids

    def _replace_column_ids_to_names(self, filters, order_by, grouping):
        # Collect list of column id's from query parameters
        columns_ids = set()
        columns_ids.update({column['field'] for column in order_by})
        if grouping:
            columns_ids.update(set(grouping['columns']))
        filter_field_names = set()
        # Filters object contains nested objects
        # [{
        #     "and": [
        #         {
        #             "or": [
        #                 {"field": "varchar", "op": "eq", "value": "string24"},
        #                 {"field": "numeric", "op": "eq", "value": 42},
        #             ]
        #         }]
        # }]
        # So we need to recursively loop and get to the last child object which contains the column id values
        # and extract the column ids
        self._iterate_filter_tree_and_apply_field_function(filters, self._extract_field_names(filter_field_names))
        columns_ids.update(filter_field_names)
        columns = Column.objects.filter(id__in=columns_ids)
        columns_name_dict = {column.id: column for column in columns}
        # Replace column id value used in the `field` property with column name
        converted_order_by = [{**column, 'field': columns_name_dict[column['field']].name} for column in order_by]
        group_by_columns_names = []
        if grouping:
            group_by_columns_names = [columns_name_dict[column_id].name for column_id in grouping['columns']]

        # Replace column id values used in the `columns` property with column names
        name_converted_group_by = {**grouping, 'columns': group_by_columns_names}
        # self._convert_filter_field_id_to_name modifies the argument passed which affects the original object
        converted_filters_object = copy.deepcopy(filters)
        # recursively loop and get to the last child object which contains the `field` property that holds the column id
        # and column ids with name
        self._iterate_filter_tree_and_apply_field_function(
            converted_filters_object,
            self._convert_filter_field_id_to_name(columns_name_dict)
        )
        return converted_filters_object, name_converted_group_by, converted_order_by

    def paginate_queryset(
            self, queryset, request, table_id, filters=[], order_by=[], grouping={},
    ):

        # Convert column ids from `filters`, `order_by` and `grouping` into column names before passing it to the db layer.
        converted_filters_object, converted_group_by, converted_order_by = self._replace_column_ids_to_names(
            filters,
            order_by,
            grouping
        )

        group_by = GroupBy(**converted_group_by) if converted_group_by else None
        records = super().paginate_queryset(
            queryset,
            request,
            table_id,
            filters=converted_filters_object,
            order_by=converted_order_by,
            group_by=group_by,
        )

        if records:
            processed_records, groups = process_annotated_records(records)
        else:
            processed_records, groups = None, None

        if group_by:
            self.grouping = {
                'columns': group_by.columns,
                'mode': group_by.mode,
                'num_groups': group_by.num_groups,
                'ranged': group_by.ranged,
                'groups': groups,
            }
        else:
            self.grouping = None

        return processed_records
