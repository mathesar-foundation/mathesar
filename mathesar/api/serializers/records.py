from psycopg2.errors import NotNullViolation, UniqueViolation, CheckViolation
from rest_framework import serializers
from rest_framework import status
from sqlalchemy.exc import IntegrityError
from db.records.exceptions import InvalidDate, InvalidDateFormat

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Column
from mathesar.api.utils import follows_json_number_spec
from mathesar.database.types import UIType


class RecordListParameterSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    filter = serializers.JSONField(required=False, default=None)
    order_by = serializers.JSONField(required=False, default=[])
    grouping = serializers.JSONField(required=False, default={})
    duplicate_only = serializers.JSONField(required=False, default=None)
    search_fuzzy = serializers.JSONField(required=False, default=[])


class RecordSerializer(MathesarErrorMessageMixin, serializers.BaseSerializer):
    def update(self, instance, validated_data):
        table = self.context['table']
        try:
            record = table.update_record(instance['id'], validated_data)
        except InvalidDate as e:
            raise database_api_exceptions.InvalidDateAPIException(
                e,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except InvalidDateFormat as e:
            raise database_api_exceptions.InvalidDateFormatAPIException(
                e,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            if type(e.orig) == NotNullViolation:
                raise database_api_exceptions.NotNullViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    table=table
                )
            elif type(e.orig) == UniqueViolation:
                raise database_api_exceptions.UniqueViolationAPIException(
                    e,
                    message="The requested update violates a uniqueness constraint",
                    table=table,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            elif type(e.orig) == CheckViolation:
                raise database_api_exceptions.CheckViolationAPIException(
                    e,
                    message="The requested update violates a check constraint",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise database_api_exceptions.MathesarAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)
        return record

    def create(self, validated_data):
        table = self.context['table']
        try:
            record = table.create_record_or_records(validated_data)
        except IntegrityError as e:
            if type(e.orig) == NotNullViolation:
                raise database_api_exceptions.NotNullViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    table=table
                )
            elif type(e.orig) == UniqueViolation:
                raise database_api_exceptions.UniqueViolationAPIException(
                    e,
                    message="The requested insert violates a uniqueness constraint",
                    table=table,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            elif type(e.orig) == CheckViolation:
                raise database_api_exceptions.CheckViolationAPIException(
                    e,
                    message="The requested insert violates a check constraint",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise database_api_exceptions.MathesarAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)
        return record

    def to_representation(self, instance):
        records = instance._asdict() if not isinstance(instance, dict) else instance
        columns_map = self.context['columns_map']
        records = {columns_map[column_name]: column_value for column_name, column_value in records.items()}
        return records

    def to_internal_value(self, data):
        columns_map = self.context['columns_map'].inverse
        data = {columns_map[int(column_id)]: value for column_id, value in data.items()}
        # If the data type of the column is number then the value must be an integer
        # or a string which follows JSON number spec.
        # TODO consider moving below routine to a DRF validate function
        for column_name, value in data.items():
            column = Column.objects.get(id=columns_map.inverse[column_name])
            is_number = column.ui_type == UIType.NUMBER
            value_is_string = type(value) is str
            if is_number and value_is_string and not follows_json_number_spec(value):
                raise database_api_exceptions.MathesarAPIException(
                    IntegrityError,
                    status_code=status.HTTP_400_BAD_REQUEST,
                    message="Number strings should follow JSON number spec",
                    field=column_name
                )
        return data
