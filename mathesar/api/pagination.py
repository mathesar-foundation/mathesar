from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from db.records.operations.group import GroupBy
from mathesar.api.utils import get_table_or_404, process_annotated_records


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
        self,
        queryset,
        request,
        table,
        filters=None,
        order_by=[],
        group_by=None,
        search=[],
        duplicate_only=None,
    ):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        # TODO: Cache count value somewhere, since calculating it is expensive.
        self.count = table.sa_num_records(filter=filters, search=search)
        self.request = request

        return table.get_records(
            limit=self.limit,
            offset=self.offset,
            filter=filters,
            order_by=order_by,
            group_by=group_by,
            search=search,
            duplicate_only=duplicate_only,
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

    def paginate_queryset(
        self,
        queryset,
        request,
        table,
        column_name_id_bidirectional_map,
        filters=None,
        order_by=[],
        grouping={},
        search=[],
        duplicate_only=None,
    ):
        group_by = GroupBy(**grouping) if grouping else None
        records = super().paginate_queryset(
            queryset=queryset,
            request=request,
            table=table,
            filters=filters,
            order_by=order_by,
            group_by=group_by,
            search=search,
            duplicate_only=duplicate_only,
        )

        if records:
            processed_records, groups = process_annotated_records(
                records,
                column_name_id_bidirectional_map,
            )
        else:
            processed_records, groups = None, None

        if group_by:
            self.grouping = {
                'columns': [column_name_id_bidirectional_map[n] for n in group_by.columns],
                'mode': group_by.mode,
                'num_groups': group_by.num_groups,
                'bound_tuples': group_by.bound_tuples,
                'count_by': group_by.count_by,
                'global_min': group_by.global_min,
                'global_max': group_by.global_max,
                'preproc': group_by.preproc,
                'prefix_length': group_by.prefix_length,
                'ranged': group_by.ranged,
                'groups': groups,
            }
        else:
            self.grouping = None

        return processed_records
