"""The functions in this module wrap SQL functions that use `ALTER TABLE`."""
import json

from db import connection as db_conn


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
