"""This module contains functions to load the Library Management dataset."""

from sqlalchemy import text
from mathesar.examples.base import LIBRARY_MANAGEMENT, LIBRARY_ONE, LIBRARY_TWO


def load_library_dataset(engine, safe_mode=False):
    """
    Load the library dataset into a "Library Management" schema.

    Args:
        engine: an SQLAlchemy engine defining the connection to load data into.
        safe_mode: When True, we will throw an error if the "Library Management"
                   schema already exists instead of dropping it.

    Uses given engine to define database to load into.
    Destructive, and will knock out any previous "Library Management"
    schema in the given database, unless safe_mode=True.
    """
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{LIBRARY_MANAGEMENT}" CASCADE;""")
    create_schema_query = text(f"""CREATE SCHEMA "{LIBRARY_MANAGEMENT}";""")
    set_search_path = text(f"""SET search_path="{LIBRARY_MANAGEMENT}";""")
    with engine.begin() as conn, open(LIBRARY_ONE) as f1, open(LIBRARY_TWO) as f2:
        if safe_mode is False:
            conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f1.read()))
        conn.execute(text(f2.read()))
