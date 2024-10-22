import json
from db.connection import exec_msar_func
from db.types.base import PostgresType


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
    return exec_msar_func(
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
    import_info = exec_msar_func(
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
