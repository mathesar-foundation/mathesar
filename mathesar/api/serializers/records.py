from psycopg2.errors import NotNullViolation
from rest_framework import serializers
from rest_framework import status
from sqlalchemy.exc import IntegrityError

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin


class RecordListParameterSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    filter = serializers.JSONField(required=False, default=None)
    order_by = serializers.JSONField(required=False, default=[])
    grouping = serializers.JSONField(required=False, default={})
    duplicate_only = serializers.JSONField(required=False, default=None)


class RecordSerializer(MathesarErrorMessageMixin, serializers.BaseSerializer):
    def update(self, instance, validated_data):
        table = self.context['table']
        record = table.update_record(instance['id'], validated_data)
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
        return data
