from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class DefaultLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 500

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.count),
            ('group_count', self.group_count),
            ('results', data)
        ]))


class ColumnLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        table = queryset.get(id=table_id)
        self.count = len(table.sa_columns)
        self.request = request
        return list(table.sa_columns)[self.offset:self.offset + self.limit]


class TableLimitOffsetPagination(DefaultLimitOffsetPagination):

    def paginate_queryset(self, queryset, request, table_id,
                          filters=[], order_by=[], group_count_by=[]):
        self.limit = self.get_limit(request)
        if self.limit is None:
            self.limit = self.default_limit
        self.offset = self.get_offset(request)
        # TODO: Cache count value somewhere, since calculating it is expensive.
        table = queryset.get(id=table_id)
        self.count = table.sa_num_records
        self.request = request

        if group_count_by:
            group_count = table.get_group_counts(
                group_count_by, self.limit, self.offset,
                filters=filters, order_by=order_by
            )
            # Convert the tuple keys into strings so it can be converted to JSON
            group_count = {','.join(k): v for k, v in group_count.items()}
            self.group_count = {
                'group_count_by': group_count_by,
                'results': group_count,
            }
        else:
            self.group_count = {
                'group_count_by': None,
                'results': None,
            }

        return table.get_records(
            self.limit, self.offset, filters=filters, order_by=order_by,
        )
