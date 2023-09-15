"""Python functions to add columns to preexisting tables."""
import json

from alembic.migration import MigrationContext
from alembic.operations import Operations
from psycopg.errors import InvalidTextRepresentation, InvalidParameterValue

from db.columns.defaults import DEFAULT, NAME, NULLABLE, TYPE, DESCRIPTION
from db.columns.exceptions import InvalidDefaultError, InvalidTypeOptionError
from db.connection import execute_msar_func_with_engine
from db.tables.operations.select import reflect_table_from_oid
from db.types.base import PostgresType
from db.metadata import get_empty_metadata


def create_column(engine, table_oid, column_data):
    column_name = (column_data.get(NAME) or '').strip() or None
    column_type_id = (
        column_data.get(
            # TYPE = 'sa_type'. This is coming straight from the API.
            # TODO Determine whether we actually need 'sa_type' and 'type'
            TYPE, column_data.get("type")
        )
        or PostgresType.CHARACTER_VARYING.id
    )
    column_type_options = column_data.get("type_options", {})
    column_nullable = column_data.get(NULLABLE, True)
    default_value = column_data.get(DEFAULT, {}).get('value')
    column_description = column_data.get(DESCRIPTION)
    col_create_def = [
        {
            "name": column_name,
            "type": {"name": column_type_id, "options": column_type_options},
            "not_null": not column_nullable,
            "default": default_value,
            "description": column_description,
        }
    ]
    try:
        curr = execute_msar_func_with_engine(
            engine, 'add_columns',
            table_oid,
            json.dumps(col_create_def)
        )
    except InvalidTextRepresentation:
        raise InvalidDefaultError
    except InvalidParameterValue:
        raise InvalidTypeOptionError
    return curr.fetchone()[0]


def bulk_create_mathesar_column(engine, table_oid, columns, schema):
    # TODO reuse metadata
    table = reflect_table_from_oid(table_oid, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        for column in columns:
            op.add_column(table.name, column, schema=schema)


def duplicate_column(
        table_oid,
        copy_from_attnum,
        engine,
        new_column_name=None,
        copy_data=True,
        copy_constraints=True
):
    curr = execute_msar_func_with_engine(
        engine,
        'copy_column',
        table_oid,
        copy_from_attnum,
        new_column_name,
        copy_data,
        copy_constraints
    )
    return curr.fetchone()[0]
