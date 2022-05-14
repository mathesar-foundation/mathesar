import os

from rest_framework import status
from rest_framework.exceptions import ValidationError

from db.tables.operations.alter import alter_table, SUPPORTED_TABLE_ALTER_ARGS
from db.schemas.operations.alter import alter_schema, SUPPORTED_SCHEMA_ALTER_ARGS
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions import base_exceptions as base_api_exceptions
from mathesar.reflection import reflect_columns_from_table


def user_directory_path(instance, filename):
    user_identifier = instance.user.username if instance.user else 'anonymous'
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return os.path.join(user_identifier, filename)


def update_sa_table(table, validated_data):
    errors = [base_api_exceptions.ErrorBody(
        ErrorCodes.UnsupportedAlter.value,
        message=f'Updating {arg} for tables is not supported.'
    )
        for arg in set(validated_data) - SUPPORTED_TABLE_ALTER_ARGS]
    if errors:
        raise base_api_exceptions.GenericAPIException(errors, status_code=status.HTTP_400_BAD_REQUEST)
    try:
        data = update_id_to_attnum(table, validated_data)
        alter_table(table.name, table.oid, table.schema.name, table.schema._sa_engine, data)
        reflect_columns_from_table(table)
    # TODO: Catch more specific exceptions
    except Exception as e:
        raise base_api_exceptions.MathesarAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)


def update_sa_schema(schema, validated_data):
    errors = [base_api_exceptions.ErrorBody(
        ErrorCodes.UnsupportedAlter.value,
        message=f'Updating {arg} for schema is not supported.'
    )
        for arg in set(validated_data) - SUPPORTED_SCHEMA_ALTER_ARGS]
    if errors:
        raise base_api_exceptions.GenericAPIException(errors, status_code=status.HTTP_400_BAD_REQUEST)
    if errors:
        raise ValidationError(errors)
    alter_schema(schema.name, schema._sa_engine, validated_data)


def update_id_to_attnum(table, validated_data):
    if 'columns' in validated_data:
        data = validated_data.get('columns')
        queryset = table.columns.all()
        for column_data in data:
            col_id = column_data.get('id', None)
            if col_id is not None:
                attnum = queryset.get(id=col_id).attnum
                column_data['attnum'] = attnum
                column_data.pop('id')
    return validated_data
