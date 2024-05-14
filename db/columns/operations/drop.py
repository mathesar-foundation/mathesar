"""The functions in this module wrap SQL functions that drop columns."""
from db import connection as db_conn


def drop_column(table_oid, column_attnum, engine):
    """
    Drop the given column from the given table.

    Args:
        table_oid: OID of the table whose column we'll drop.
        column_attnum: The attnum of the column to drop.
        engine: SQLAlchemy engine object for connecting.

    Returns:
        Returns a string giving the command that was run.
    """
    return db_conn.execute_msar_func_with_engine(
        engine, 'drop_columns', table_oid, column_attnum
    ).fetchone()[0]


def drop_columns_from_table(table_oid, column_attnums, conn):
    """
    Drop the given columns from the given table.

    Args:
        table_oid: OID of the table whose columns we'll drop.
        column_attnums: The attnums of the columns to drop.
        conn: A psycopg connection to the relevant database.
    """
    db_conn.exec_msar_func(conn, 'drop_columns', table_oid, *column_attnums)
