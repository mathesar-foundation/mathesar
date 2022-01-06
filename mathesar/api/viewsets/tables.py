from django_filters import rest_framework as filters
from psycopg2.errors import DuplicateTable, InvalidTextRepresentation, CheckViolation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, APIException
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import ProgrammingError, DataError, IntegrityError

from db.types.exceptions import UnsupportedTypeException
from mathesar.api.filters import TableFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.tables import TableSerializer, TablePreviewSerializer
from mathesar.error_codes import ErrorCodes
from mathesar.errors import ExceptionBody, CustomApiException, CustomValidationError, get_default_exception_detail
from mathesar.models import Table
from mathesar.utils.tables import (
    get_table_column_types, create_table_from_datafile, create_empty_table,
    gen_table_name
)


class TableViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin):
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

    def create(self, request):
        serializer = TableSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        schema = serializer.validated_data['schema']
        data_files = serializer.validated_data.get('data_files')
        name = serializer.validated_data.get('name') or gen_table_name(schema, data_files)

        try:
            if data_files:
                table = create_table_from_datafile(data_files, name, schema)
            else:
                table = create_empty_table(name, schema)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise ValidationError(
                    f"Relation {request.data['name']} already exists in schema {request.data['schema']}"
                )
            else:
                raise APIException(e)

        serializer = TableSerializer(table, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = TableSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)
        table = self.get_object()

        # Save the fields that are stored in the model.
        present_model_fields = []
        for model_field in table.MODEL_FIELDS:
            if model_field in serializer.validated_data:
                setattr(table, model_field, serializer.validated_data[model_field])
                present_model_fields.append(model_field)
        table.save(update_fields=present_model_fields)
        for key in present_model_fields:
            del serializer.validated_data[key]

        # Save the fields that are stored in the underlying DB.
        try:
            table.update_sa_table(serializer.validated_data)
        except ValueError as e:
            raise ValidationError(e)

        # Reload the table to avoid cached properties
        table = self.get_object()
        serializer = TableSerializer(table, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        table = self.get_object()
        table.delete_sa_table()
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['get'], detail=True)
    def type_suggestions(self, request, pk=None):
        table = self.get_object()
        col_types = get_table_column_types(table)
        return Response(col_types)

    @action(methods=['post'], detail=True)
    def previews(self, request, pk=None):
        table = self.get_object()
        serializer = TablePreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        columns_field_key = "columns"
        columns = serializer.data[columns_field_key]

        column_names = [col["name"] for col in columns]
        if not len(column_names) == len(set(column_names)):
            raise CustomValidationError([ExceptionBody(ErrorCodes.DistinctColumnNameRequired.value,
                                                       "Column names must be distinct", 'columns')])
        if not len(columns) == len(table.sa_columns):
            raise CustomValidationError([ExceptionBody(ErrorCodes.ColumnSizeMismatch.value,
                                                       "Incorrect number of columns in request.", 'columns')])

        table_data = TableSerializer(table, context={"request": request}).data
        try:
            preview_records = table.get_preview(columns)
        except (DataError, IntegrityError) as e:
            if type(e.orig) == InvalidTextRepresentation or type(e.orig) == CheckViolation:
                raise CustomValidationError(
                    [ExceptionBody(ErrorCodes.InvalidTypeCast.value, "Invalid type cast requested.",
                     field='columns')])
            else:
                raise CustomApiException(e, ErrorCodes.NonClassifiedIntegrityError.value)
        except UnsupportedTypeException as e:
            raise CustomValidationError([get_default_exception_detail(e, ErrorCodes.UnsupportedType.value, message=None,
                                                                      field='columns')])
        except Exception as e:
            raise CustomApiException(e)
        table_data.update(
            {
                # There's no way to reflect actual column data without
                # creating a view, so we just use the submission, assuming
                # no errors means we changed to the desired names and types
                "columns": columns,
                "records": preview_records
            }
        )

        return Response(table_data)
