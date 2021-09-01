from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from mathesar.models import Table
from rest_framework.exceptions import NotFound


def get_table_or_404(queryset, pk):
    try:
        table = queryset.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table


class DefaultLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 500

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.count),
            ('results', data)
        ]))


class ColumnLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        table = get_table_or_404(queryset=queryset, pk=table_id)
        self.count = len(table.sa_columns)
        self.request = request
        return list(table.sa_columns)[self.offset:self.offset + self.limit]


class TableLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id,
                          filters=[], order_by=[]):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        # TODO: Cache count value somewhere, since calculating it is expensive.
        table = get_table_or_404(queryset=queryset, pk=table_id)
        self.count = table.sa_num_records(filters=filters)
        self.request = request

        return table.get_records(
            self.limit, self.offset, filters=filters, order_by=order_by,
        )


class TableLimitOffsetGroupPagination(TableLimitOffsetPagination):
    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.count),
            ('group_count', self.group_count),
            ('results', data)
        ]))

    def paginate_queryset(self, queryset, request, table_id,
                          filters=[], order_by=[], group_count_by=[]):
        records = super().paginate_queryset(
            queryset, request, table_id, filters=filters, order_by=order_by
        )

        table = get_table_or_404(queryset=queryset, pk=table_id)
        if group_count_by:
            group_count = table.get_group_counts(
                group_count_by, self.limit, self.offset,
                filters=filters, order_by=order_by
            )
            # Convert the tuple keys into strings so it can be converted to JSON
            group_count = [{"values": list(cols), "count": count}
                           for cols, count in group_count.items()]
            self.group_count = {
                'group_count_by': group_count_by,
                'results': group_count,
            }
        else:
            self.group_count = {
                'group_count_by': None,
                'results': None,
            }

        return records
