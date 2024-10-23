import json

from db.connection import exec_msar_func
from db.deprecated.types.base import PostgresType


DEFAULT = "default"
DESCRIPTION = "description"
NAME = "name"
NULLABLE = "nullable"


def get_column_info_for_table(table, conn):
    """
    Return a list of dictionaries describing the columns of the table.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    The returned list contains dictionaries of the following form:

        {
            "id": <int>,
            "name": <str>,
            "type": <str>,
            "type_options": {
                "precision": <int>,
                "scale": <int>,
                "fields": <str>,
                "length": <int>,
                "item_type": <str>,
            },
            "nullable": <bool>,
            "primary_key": <bool>,
            "valid_target_types": [<str>, <str>, ..., <str>]
            "default": {"value": <str>, "is_dynamic": <bool>},
            "has_dependents": <bool>,
            "current_role_priv": [<str>, <str>, ...],
            "description": <str>
        }

    The fields of the "type_options" dictionary are all optional,
    depending on the "type" value.

    Args:
        table: The table for which we want column info.
    """
    return exec_msar_func(conn, 'get_column_info', table).fetchone()[0]


def alter_columns_in_table(table_oid, column_data_list, conn):
    """
    Alter columns of the given table in bulk.

    For a description of column_data_list, see _transform_column_alter_dict

    Args:
        table_oid: The OID of the table whose columns we'll alter.
        column_data_list: a list of dicts describing the alterations to make.
    """
    transformed_column_data = [
        _transform_column_alter_dict(column) for column in column_data_list
    ]
    exec_msar_func(
        conn, 'alter_columns', table_oid, json.dumps(transformed_column_data)
    )
    return len(column_data_list)


# TODO This function wouldn't be needed if we had the same form in the DB
# as the RPC API function.
def _transform_column_alter_dict(data):
    """
    Transform the data dict into the form needed for the DB functions.

    Input data form:
    {
        "id": <int>,
        "name": <str>,
        "type": <str>,
        "type_options": <dict>,
        "nullable": <bool>,
        "default": {"value": <any>}
        "description": <str>
    }

    Output form:
    {
        "attnum": <int>,
        "type": {"name": <str>, "options": <dict>},
        "name": <str>,
        "not_null": <bool>,
        "default": <any>,
        "description": <str>
    }

    Note that keys with empty values will be dropped, except "default"
    and "description". Explicitly setting these to None requests dropping
    the associated property of the underlying column.
    """
    type_ = {"name": data.get('type'), "options": data.get('type_options')}
    new_type = {k: v for k, v in type_.items() if v} or None
    nullable = data.get(NULLABLE)
    not_null = not nullable if nullable is not None else None
    column_name = (data.get(NAME) or '').strip() or None
    raw_alter_def = {
        "attnum": data["id"],
        "type": new_type,
        "not_null": not_null,
        "name": column_name,
        "description": data.get("description")
    }
    alter_def = {k: v for k, v in raw_alter_def.items() if v is not None}

    default_dict = data.get("default", {})
    if default_dict is None:
        alter_def.update(default=None)
    elif "value" in default_dict:
        alter_def.update(default=default_dict["value"])

    return alter_def


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
    result = exec_msar_func(
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


def drop_columns_from_table(table_oid, column_attnums, conn):
    """
    Drop the given columns from the given table.

    Args:
        table_oid: OID of the table whose columns we'll drop.
        column_attnums: The attnums of the columns to drop.
        conn: A psycopg connection to the relevant database.
    """
    return exec_msar_func(
        conn, 'drop_columns', table_oid, *column_attnums
    ).fetchone()[0]
