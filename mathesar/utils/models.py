import os
from rest_framework.exceptions import ValidationError

from db.tables.operations.alter import alter_table, SUPPORTED_TABLE_ALTER_ARGS
from db.schemas.operations.alter import alter_schema, SUPPORTED_SCHEMA_ALTER_ARGS
from mathesar.reflection import reflect_columns_from_table


def user_directory_path(instance, filename):
    user_identifier = instance.user.username if instance.user else 'anonymous'
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return os.path.join(user_identifier, filename)


def update_sa_table(table, validated_data):
    errors = {
        arg: f'Updating {arg} for tables is not supported.'
        for arg in set(validated_data) - SUPPORTED_TABLE_ALTER_ARGS
    }
    if errors:
        raise ValidationError(errors)
    try:
        alter_table(table.name, table.oid, table.schema.name, table.schema._sa_engine, validated_data)
        reflect_columns_from_table(table)
    # TODO: Catch more specific exceptions
    except Exception as e:
        raise ValidationError(e)


def update_sa_schema(schema, validated_data):
    errors = {
        arg: f'Updating {arg} for schema is not supported.'
        for arg in set(validated_data) - SUPPORTED_SCHEMA_ALTER_ARGS
    }
    if errors:
        raise ValidationError(errors)
    alter_schema(schema.name, schema._sa_engine, validated_data)
