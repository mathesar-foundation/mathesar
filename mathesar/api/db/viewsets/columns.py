import warnings
from psycopg2.errors import DuplicateColumn
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from sqlalchemy.exc import ProgrammingError

from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions,
    base_exceptions as database_base_api_exceptions,
)
from mathesar.api.exceptions.generic_exceptions import base_exceptions as base_api_exceptions
from db.columns.exceptions import (
    DynamicDefaultWarning, InvalidDefaultError, InvalidTypeOptionError, InvalidTypeError,
)
from db.columns.operations.select import get_column_attnum_from_name
from db.types.exceptions import InvalidTypeParameters
from db.records.exceptions import UndefinedFunction
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.columns import ColumnSerializer
from mathesar.api.utils import get_table_or_404
from mathesar.models import Column


class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return Column.objects.filter(table=self.kwargs['table_pk']).order_by('attnum')

    def create(self, request, table_pk=None):
        table = get_table_or_404(table_pk)
        # We only support adding a single column through the API.
        serializer = ColumnSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        type_options = request.data.get('type_options', None)
        if type_options is not None:
            scale = type_options.get('scale', None)
            precision = type_options.get('precision', None)
            if scale is not None and precision is None:
                request.data['type_options']['precision'] = 1000
        if 'source_column' in serializer.validated_data:
            column = table.duplicate_column(
                serializer.validated_data['source_column'],
                serializer.validated_data['copy_source_data'],
                serializer.validated_data['copy_source_constraints'],
                serializer.validated_data.get('name'),
            )
        else:
            try:
                # TODO Refactor add_column to user serializer validated date instead of request data
                column = table.add_column(request.data)
            except ProgrammingError as e:
                if type(e.orig) == DuplicateColumn:
                    name = request.data['name']
                    raise database_api_exceptions.DuplicateTableAPIException(
                        e,
                        message=f'Column {name} already exists',
                        field='name',
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    raise database_base_api_exceptions.ProgrammingAPIException(e)
            except TypeError as e:
                raise base_api_exceptions.TypeErrorAPIException(
                    e,
                    message="Unknown type_option passed",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except InvalidDefaultError as e:
                raise database_api_exceptions.InvalidDefaultAPIException(
                    e,
                    message=f'default "{request.data["default"]}" is invalid for type {request.data["type"]}',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except (InvalidTypeOptionError, InvalidTypeParameters) as e:
                type_options = request.data.get('type_options', '')
                raise database_api_exceptions.InvalidTypeOptionAPIException(
                    e,
                    message=f'parameter dict {type_options} is invalid for type {request.data["type"]}',
                    field="type_options",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except InvalidTypeError as e:
                raise database_api_exceptions.InvalidTypeCastAPIException(
                    e,
                    message='This type casting is invalid.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        dj_column = Column(
            table=table,
            attnum=get_column_attnum_from_name(table.oid, column.name, table.schema._sa_engine),
            **serializer.validated_model_fields
        )
        dj_column.save()
        out_serializer = ColumnSerializer(dj_column)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, table_pk=None):
        column_instance = self.get_object()
        table = column_instance.table
        serializer = ColumnSerializer(instance=column_instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with warnings.catch_warnings():
            warnings.filterwarnings("error", category=DynamicDefaultWarning)
            try:
                table.alter_column(column_instance._sa_column.column_attnum, serializer.validated_data)
            except UndefinedFunction as e:
                raise database_api_exceptions.UndefinedFunctionAPIException(
                    e,
                    message='This type cast is not implemented',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except ProgrammingError as e:
                raise database_base_api_exceptions.ProgrammingAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except IndexError as e:
                raise base_api_exceptions.NotFoundAPIException(e)
            except TypeError as e:
                # TODO this error is actually much more general than just badly specified
                # type_options problems. e.g. if a bad keyword argument is passed to a function,
                # TypeError will be raised.
                raise database_api_exceptions.InvalidTypeOptionAPIException(
                    e,
                    message="Unknown type_option passed",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except InvalidDefaultError as e:
                raise database_api_exceptions.InvalidDefaultAPIException(
                    e,
                    message=f'default "{request.data["default"]}" is invalid for this column',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except DynamicDefaultWarning as e:
                raise database_api_exceptions.DynamicDefaultAPIException(
                    e,
                    message='Changing type of columns with dynamically-generated defaults is not supported.'
                            'Delete or change the default first.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except (InvalidTypeOptionError, InvalidTypeParameters) as e:
                type_options = request.data.get('type_options', '')
                raise database_api_exceptions.InvalidTypeOptionAPIException(
                    e,
                    message=f'parameter dict {type_options} is invalid for type {request.data["type"]}',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except InvalidTypeError as e:
                raise database_api_exceptions.InvalidTypeCastAPIException(
                    e,
                    message='This type casting is invalid.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                raise base_api_exceptions.MathesarAPIException(e)

        serializer.update(column_instance, serializer.validated_model_fields)
        # Invalidate the cache as the underlying columns have changed
        column_instance = self.get_object()
        out_serializer = ColumnSerializer(column_instance)
        return Response(out_serializer.data)

    def destroy(self, request, pk=None, table_pk=None):
        column_instance = self.get_object()
        table = column_instance.table
        try:
            table.drop_column(column_instance.attnum)
            column_instance.delete()
        except IndexError:
            raise NotFound
        return Response(status=status.HTTP_204_NO_CONTENT)
