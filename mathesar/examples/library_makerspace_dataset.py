import os
from psycopg import sql

from mathesar.examples.base import RESOURCES

LIBRARY_MAKERSPACE_SQL = "load_library_makerspace.sql"


def load_library_makerspace_dataset(conn):
    """Load the library makerspace dataset."""

    # This function has to let the underlying script handle the schema to
    # make sure the trigger defined by that script works.
    file_path = os.path.join(RESOURCES, LIBRARY_MAKERSPACE_SQL)
    with open(file_path) as f:
        conn.execute(f.read())
