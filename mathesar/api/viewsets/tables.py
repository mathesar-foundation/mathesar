from django_filters import rest_framework as filters
from psycopg2.errors import InvalidTextRepresentation, CheckViolation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.response import Response
from sqlalchemy.exc import DataError, IntegrityError

from db.types.exceptions import UnsupportedTypeException
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.exceptions import ExceptionBody, get_default_exception_detail, CustomApiException, \
    GenericValidationError
from mathesar.api.filters import TableFilter
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.tables import TableSerializer, TablePreviewSerializer
from mathesar.models import Table
from mathesar.utils.tables import (
    get_table_column_types
)


class TableViewSet(CreateModelMixin, RetrieveModelMixin, ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TableSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TableFilter

    def get_queryset(self):
        return Table.objects.all().order_by('-created_at')

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
        serializer = TablePreviewSerializer(data=request.data, context={"request": request, 'table': table})
        serializer.is_valid(raise_exception=True)
        columns_field_key = "columns"
        columns = serializer.data[columns_field_key]
        table_data = TableSerializer(table, context={"request": request}).data
        try:
            preview_records = table.get_preview(columns)
        except (DataError, IntegrityError) as e:
            if type(e.orig) == InvalidTextRepresentation or type(e.orig) == CheckViolation:
                exception_details = ExceptionBody(ErrorCodes.InvalidTypeCast.value,
                                                  "Invalid type cast requested.",
                                                  field='columns')
                raise GenericValidationError([exception_details])
            else:
                raise CustomApiException(e, ErrorCodes.NonClassifiedIntegrityError.value)
        except UnsupportedTypeException as e:
            exception_details = get_default_exception_detail(e,
                                                             ErrorCodes.UnsupportedType.value,
                                                             message=None,
                                                             field='columns')
            raise GenericValidationError([exception_details])
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
