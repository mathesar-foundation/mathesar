import json

from db import connection as db_conn
from db.columns.defaults import NAME, NULLABLE, DESCRIPTION


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
    db_conn.exec_msar_func(
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


# TODO This function is deprecated. Remove it when possible.
def _process_column_alter_dict_dep(column_data, column_attnum=None):
    """
    Transform the column_data dict into the form needed for the DB functions.

    Input column_data form:
    {
        "type": <str>
        "type_options": <dict>,
        "column_default_dict": {"is_dynamic": <bool>, "value": <any>}
        "nullable": <bool>,
        "name": <str>,
        "delete": <bool>,
        "description": <str>
    }

    Output form:
    {
        "type": {"name": <str>, "options": <dict>},
        "name": <str>,
        "not_null": <bool>,
        "default": <any>,
        "delete": <bool>,
        "description": <str>
    }

    Note that keys with empty values will be dropped, unless the given "default"
    key is explicitly set to None.
    """
    DEFAULT_DICT = 'column_default_dict'
    DEFAULT_KEY = 'value'

    column_type = {
        "name": column_data.get('type'),
        "options": column_data.get('type_options')
    }
    new_type = {k: v for k, v in column_type.items() if v} or None
    column_nullable = column_data.get(NULLABLE)
    column_delete = column_data.get("delete")
    column_not_null = not column_nullable if column_nullable is not None else None
    column_name = (column_data.get(NAME) or '').strip() or None
    raw_col_alter_def = {
        "attnum": column_attnum or column_data.get("attnum") or column_data.get("id"),
        "type": new_type,
        "not_null": column_not_null,
        "name": column_name,
        "delete": column_delete,
    }
    col_alter_def = {k: v for k, v in raw_col_alter_def.items() if v is not None}
    # NOTE DESCRIPTION is set separately, because it shouldn't be removed if its
    # value is None (that signals that the description should be removed in the
    # db).
    if DESCRIPTION in column_data:
        column_description = column_data.get(DESCRIPTION)
        col_alter_def[DESCRIPTION] = column_description
    default_dict = column_data.get(DEFAULT_DICT, {})
    if default_dict is not None and DEFAULT_KEY in default_dict:
        default_value = column_data.get(DEFAULT_DICT, {}).get(DEFAULT_KEY)
        col_alter_def.update(default=default_value)
    elif default_dict is None:
        col_alter_def.update(default=None)

    return col_alter_def
