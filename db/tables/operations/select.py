import json
from db.connection import exec_msar_func
from db.columns import _transform_column_alter_dict


def get_table(table, conn):
    """
    Return a dictionary describing a table of a schema.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        table: The table for which we want table info.
    """
    return exec_msar_func(conn, 'get_table', table).fetchone()[0]


def get_table_info(schema, conn):
    """
    Return a list of dictionaries describing the tables of a schema.

    The `schema` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        schema: The schema for which we want table info.
    """
    return exec_msar_func(conn, 'get_table_info', schema).fetchone()[0]


def list_joinable_tables(table_oid, conn, max_depth):
    return exec_msar_func(conn, 'get_joinable_tables', max_depth, table_oid).fetchone()[0]


def get_preview(table_oid, column_list, conn, limit=20):
    """
    Preview an imported table. Returning the records from the specified columns of the table.

    Args:
        table_oid: Identity of the imported table in the user's database.
        column_list: List of settings describing the casts to be applied to the columns.
        limit: The upper limit for the number of records to return.

    Note that these casts are temporary and do not alter the data in the underlying table,
    if you wish to alter these settings permanantly for the columns see tables/alter.py.
    """
    transformed_column_data = [_transform_column_alter_dict(col) for col in column_list]
    return exec_msar_func(
        conn, 'get_preview', table_oid, json.dumps(transformed_column_data), limit
    ).fetchone()[0]
