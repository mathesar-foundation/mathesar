"""Python functions to add columns to preexisting tables."""
import json

from alembic.migration import MigrationContext
from alembic.operations import Operations
from psycopg.errors import InvalidTextRepresentation, InvalidParameterValue

from db import connection as db_conn
from db.columns.defaults import DEFAULT, NAME, NULLABLE, DESCRIPTION
from db.columns.exceptions import InvalidDefaultError, InvalidTypeOptionError
from db.tables.operations.select import reflect_table_from_oid
from db.types.base import PostgresType
from db.metadata import get_empty_metadata


def create_column(engine, table_oid, column_data):
    col_create_def = [_transform_column_create_dict(column_data)]
    try:
        curr = db_conn.execute_msar_func_with_engine(
            engine, 'add_columns',
            table_oid,
            json.dumps(col_create_def)
        )
    except InvalidTextRepresentation:
        raise InvalidDefaultError
    except InvalidParameterValue:
        raise InvalidTypeOptionError
    return curr.fetchone()[0]


def add_columns_to_table(table_oid, column_data_list, conn):
    transformed_column_data = [
        _transform_column_create_dict(col) for col in column_data_list
    ]
    result = db_conn.exec_msar_func(
        conn, 'add_columns', table_oid, json.dumps(transformed_column_data)
    ).fetchone()[0]
    return result


# TODO This function wouldn't be needed if we had the same form in the DB
# as the RPC API function.
def _transform_column_create_dict(data):
    """
    Transform the data dict into the form needed for the DB functions.

    Input data form:
    {
        "name": <str>,
        "type": <str>,
        "type_options": <dict>,
        "nullable": <bool>,
        "default": {"value": <any>}
        "description": <str>
    }

    Output form:
    {
        "type": {"name": <str>, "options": <dict>},
        "name": <str>,
        "not_null": <bool>,
        "default": <any>,
        "description": <str>
    }
    """
    return {
        "name": (data.get(NAME) or '').strip() or None,
        "type": {
            "name": data.get("type") or PostgresType.CHARACTER_VARYING.id,
            "options": data.get("type_options", {})
        },
        "not_null": not data.get(NULLABLE, True),
        "default": data.get(DEFAULT, {}).get('value'),
        "description": data.get(DESCRIPTION),
    }


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
    curr = db_conn.execute_msar_func_with_engine(
        engine,
        'copy_column',
        table_oid,
        copy_from_attnum,
        new_column_name,
        copy_data,
        copy_constraints
    )
    return curr.fetchone()[0]
