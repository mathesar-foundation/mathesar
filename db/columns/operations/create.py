"""Python functions to add columns to preexisting tables."""
import json

from db import connection as db_conn
from db.columns.defaults import DEFAULT, NAME, NULLABLE, DESCRIPTION
from db.deprecated.types.base import PostgresType


def add_columns_to_table(table_oid, column_data_list, conn):
    """
    Add columns to the given table.

    For a description of the members of column_data_list, see
    _transform_column_create_dict

    Args:
        table_oid: The OID of the table whose columns we'll alter.
        column_data_list: A list of dicts describing columns to add.
        conn: A psycopg connection.
    """
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
