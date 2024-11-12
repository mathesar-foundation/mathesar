import json
from db import connection as db_conn
from db.columns import _transform_column_alter_dict
from db.deprecated.types.base import PostgresType


def get_table(table, conn):
    """
    Return a dictionary describing a table of a schema.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        table: The table for which we want table info.
    """
    return db_conn.exec_msar_func(conn, 'get_table', table).fetchone()[0]


def get_table_info(schema, conn):
    """
    Return a list of dictionaries describing the tables of a schema.

    The `schema` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    Args:
        schema: The schema for which we want table info.
    """
    return db_conn.exec_msar_func(conn, 'get_table_info', schema).fetchone()[0]


def list_joinable_tables(table_oid, conn, max_depth):
    return db_conn.exec_msar_func(conn, 'get_joinable_tables', max_depth, table_oid).fetchone()[0]


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
    return db_conn.exec_msar_func(
        conn, 'get_preview', table_oid, json.dumps(transformed_column_data), limit
    ).fetchone()[0]


def alter_table_on_database(table_oid, table_data_dict, conn):
    """
    Alter the name, description, or columns of a table, returning name of the altered table.

    Args:
        table_oid: The OID of the table to be altered.
        table_data_dict: A dict describing the alterations to make.

    table_data_dict should have the form:
    {
        "name": <str>,
        "description": <str>,
        "columns": <list> of column_data describing columns to alter.
    }
    """
    return db_conn.exec_msar_func(
        conn, 'alter_table', table_oid, json.dumps(table_data_dict)
    ).fetchone()[0]


def create_table_on_database(
    table_name,
    schema_oid,
    conn,
    column_data_list=[],
    constraint_data_list=[],
    owner_oid=None,
    comment=None
):
    """
    Creates a table with a default id column.

    Args:
        table_name: Name of the table to be created.
        schema_oid: The OID of the schema where the table will be created.
        columns: The columns dict for the new table, in order. (optional)
        constraints: The constraints dict for the new table. (optional)
        owner_oid: The OID of the role who will own the new table.(optional)
        comment: The comment for the new table. (optional)

    Returns:
        Returns the OID and name of the created table.
    """
    return db_conn.exec_msar_func(
        conn,
        'add_mathesar_table',
        schema_oid,
        table_name,
        json.dumps(column_data_list),
        json.dumps(constraint_data_list),
        owner_oid,
        comment
    ).fetchone()[0]


def prepare_table_for_import(
    table_name,
    schema_oid,
    column_names,
    header,
    conn,
    delimiter=None,
    escapechar=None,
    quotechar=None,
    encoding=None,
    comment=None
):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.

    Returns the copy_sql and table_oid for carrying out import into the created table.
    """
    column_data_list = [
        {
            "name": column_name,
            "type": {"name": PostgresType.TEXT.id}
        } for column_name in column_names
    ]
    import_info = db_conn.exec_msar_func(
        conn,
        'prepare_table_for_import',
        schema_oid,
        table_name,
        json.dumps(column_data_list),
        header,
        delimiter,
        escapechar,
        quotechar,
        encoding,
        comment
    ).fetchone()[0]
    return (
        import_info['copy_sql'],
        import_info['table_oid'],
        import_info['table_name']
    )


def drop_table_from_database(table_oid, conn, cascade=False):
    """
    Drop a table.

    Args:
        table_oid: OID of the table to drop.
        cascade: Whether to drop the dependent objects.

    Returns:
        Returns the fully qualified name of the dropped table.
    """
    return db_conn.exec_msar_func(
        conn, 'drop_table', table_oid, cascade
    ).fetchone()[0]


def infer_table_column_data_types(conn, table_oid):
    """
    Infer the best type for each column in the table.

    Currently we only suggest different types for columns which originate
    as type `text`.

    Args:
        tab_id: The OID of the table whose columns we're inferring types for.

    The response JSON will have attnum keys, and values will be the
    result of `format_type` for the inferred type of each column.
    Restricted to columns to which the user has access.
    """
    return db_conn.exec_msar_func(
        conn, 'infer_table_column_data_types', table_oid
    ).fetchone()[0]


def move_columns_to_referenced_table(
        conn, source_table_oid, target_table_oid, move_column_attnums
):
    db_conn.exec_msar_func(
        conn,
        'move_columns_to_referenced_table',
        source_table_oid,
        target_table_oid,
        move_column_attnums
    )


def split_table(
    conn,
    old_table_oid,
    extracted_column_attnums,
    extracted_table_name,
    relationship_fk_column_name=None
):
    extracted_table_oid, new_fkey_attnum = db_conn.exec_msar_func(
        conn,
        'extract_columns_from_table',
        old_table_oid,
        extracted_column_attnums,
        extracted_table_name,
        relationship_fk_column_name
    ).fetchone()[0]
    return {
        'extracted_table_oid': extracted_table_oid,
        'new_fkey_attnum': new_fkey_attnum
    }
