"""The functions in this module wrap SQL functions that drop columns."""
from db import connection as db_conn


def drop_columns_from_table(table_oid, column_attnums, conn):
    """
    Drop the given columns from the given table.

    Args:
        table_oid: OID of the table whose columns we'll drop.
        column_attnums: The attnums of the columns to drop.
        conn: A psycopg connection to the relevant database.
    """
    return db_conn.exec_msar_func(
        conn, 'drop_columns', table_oid, *column_attnums
    ).fetchone()[0]
