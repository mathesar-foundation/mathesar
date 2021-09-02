from psycopg2.errors import DuplicateColumn, UndefinedFunction
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError, APIException
from rest_framework.response import Response
from sqlalchemy.exc import ProgrammingError

from db.columns import InvalidDefaultError, InvalidTypeOptionError, InvalidTypeError
from mathesar.api.pagination import ColumnLimitOffsetPagination
from mathesar.api.serializers import ColumnSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models import Table


class ColumnViewSet(viewsets.ViewSet):
    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    def list(self, request, table_pk=None):
        paginator = ColumnLimitOffsetPagination()
        columns = paginator.paginate_queryset(self.get_queryset(), request, table_pk)
        serializer = ColumnSerializer(columns, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        try:
            column = table.sa_columns[int(pk)]
        except IndexError:
            raise NotFound
        serializer = ColumnSerializer(column)
        return Response(serializer.data)

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        # We only support adding a single column through the API.
        serializer = ColumnSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        if 'source_column' in serializer.validated_data:
            try:
                column = table.duplicate_column(
                    serializer.validated_data['source_column'],
                    serializer.validated_data['copy_source_data'],
                    serializer.validated_data['copy_source_constraints'],
                    serializer.validated_data.get('name'),
                )
            except IndexError:
                _col_idx = serializer.validated_data['source_column']
                raise ValidationError(f'column index "{_col_idx}" not found')
        else:
            try:
                column = table.add_column(request.data)
            except ProgrammingError as e:
                if type(e.orig) == DuplicateColumn:
                    name = request.data['name']
                    raise ValidationError(
                        f'Column {name} already exists'
                    )
                else:
                    raise APIException(e)
            except TypeError:
                raise ValidationError("Unknown type_option passed")
            except InvalidDefaultError:
                raise ValidationError(
                    f'default "{request.data["default"]}" is'
                    f' invalid for type {request.data["type"]}'
                )
            except InvalidTypeOptionError:
                type_options = request.data.get('type_options', '')
                raise ValidationError(
                    f'parameter dict {type_options} is'
                    f' invalid for type {request.data["type"]}'
                )
            except InvalidTypeError:
                raise ValidationError('This type casting is invalid.')

        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        serializer = ColumnSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            column = table.alter_column(pk, serializer.validated_data)
        except ProgrammingError as e:
            if type(e.orig) == UndefinedFunction:
                raise ValidationError('This type cast is not implemented')
            else:
                raise ValidationError
        except IndexError:
            raise NotFound
        except TypeError:
            raise ValidationError("Unknown type_option passed")
        except InvalidDefaultError:
            raise ValidationError(
                f'default "{request.data["default"]}" is'
                f' invalid for this column'
            )
        except InvalidTypeOptionError:
            type_options = request.data.get('type_options', '')
            raise ValidationError(
                f'parameter dict {type_options} is'
                f' invalid for type {request.data["type"]}'
            )
        except InvalidTypeError:
            raise ValidationError('This type casting is invalid.')
        except Exception as e:
            raise APIException(e)
        out_serializer = ColumnSerializer(column)
        return Response(out_serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        table = get_table_or_404(table_pk)
        try:
            table.drop_column(pk)
        except IndexError:
            raise NotFound
        return Response(status=status.HTTP_204_NO_CONTENT)
