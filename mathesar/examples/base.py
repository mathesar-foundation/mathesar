import os
from psycopg import sql

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")
LIBRARY_MANAGEMENT = 'Library Management'


def load_dataset_sql(conn, schema_name, file_name):
    """Load dataset SQL from `file_name` into schema `schema_name`."""
    file_path = os.path.join(RESOURCES, file_name)
    create_schema_query = sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema_name))
    set_search_path = sql.SQL("SET search_path={}").format(sql.Identifier(schema_name))
    with open(file_path, 'rb') as f:
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(f.read())
