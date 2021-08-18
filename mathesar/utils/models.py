import os
from rest_framework.exceptions import ValidationError

from db.tables import update_table, SUPPORTED_TABLE_UPDATE_ARGS
from db.types.alteration import UnsupportedTypeException
from db.schemas import update_schema, SUPPORTED_SCHEMA_UPDATE_ARGS

from sqlalchemy.exc import DataError, InternalError


def user_directory_path(instance, filename):
    user_identifier = instance.user.username if instance.user else 'anonymous'
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return os.path.join(user_identifier, filename)


def update_sa_table(table, validated_data):
    errors = {
        arg: f'Updating {arg} for tables is not supported.'
        for arg in set(validated_data) - SUPPORTED_TABLE_UPDATE_ARGS
    }
    if errors:
        raise ValidationError(errors)

    try:
        update_table(table.name, table.schema.name, table.schema._sa_engine, validated_data)
    except InternalError as error:
        raise ValidationError(error)
    except DataError as error:
        raise ValidationError(error)
    except UnsupportedTypeException as error:
        raise ValidationError(error)


def update_sa_schema(schema, validated_data):
    errors = {
        arg: f'Updating {arg} for schema is not supported.'
        for arg in set(validated_data) - SUPPORTED_SCHEMA_UPDATE_ARGS
    }
    if errors:
        raise ValidationError(errors)
    update_schema(schema.name, schema._sa_engine, validated_data)
