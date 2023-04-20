"""The function in this module wraps SQL functions that drop columns."""
from db import connection as db_conn


def drop_column(table_oid, column_attnum, engine):
    """
    Drop the given columns from the given table.

    Args:
        table_oid: OID of the table whose columns we'll drop.
        column_attnum: The attnums of the columns to drop.
        engine: SQLAlchemy engine object for connecting.

    Returns:
        Returns a string giving the command that was run.
    """
    return db_conn.execute_msar_func_with_engine(
        engine, 'drop_columns', table_oid, column_attnum
    ).fetchone()[0]
