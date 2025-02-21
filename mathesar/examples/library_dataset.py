"""This module contains functions to load the Library Management dataset."""

from psycopg import sql
from mathesar.examples.base import LIBRARY_MANAGEMENT, LIBRARY_ONE, LIBRARY_TWO


def load_library_dataset(conn):
    """
    Load the library dataset into a "Library Management" schema.

    Args:
        conn: a psycopg (3) connection for loading the data.

    Uses given connection to define database to load into. Raises an
    Exception if the "Library Management" schema already exists.
    """
    create_schema_query = sql.SQL("CREATE SCHEMA {}").format(
        sql.Identifier(LIBRARY_MANAGEMENT)
    )
    set_search_path = sql.SQL("SET search_path={}").format(
        sql.Identifier(LIBRARY_MANAGEMENT)
    )
    with open(LIBRARY_ONE, 'rb') as f1, open(LIBRARY_TWO, 'rb') as f2:
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(f1.read())
        conn.execute(f2.read())
