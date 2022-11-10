import os

from sqlalchemy import text

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")


def load_library_dataset(engine):
    """
    Load the library dataset into a "Library Management" schema.

    Uses given engine to define database to load into.
    Destructive, and will knock out any previous "Library Management"
    schema in the given database.
    """
    library_management = 'Library Management'
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{library_management}";""")
    create_schema_query = text(f"""CREATE SCHEMA "{library_management}";""")
    set_search_path = text(f"""SET search_path="{library_management}";""")
    with engine.begin() as conn, open(LIBRARY_ONE) as f1, open(LIBRARY_TWO) as f2:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f1.read()))
        conn.execute(text(f2.read()))
