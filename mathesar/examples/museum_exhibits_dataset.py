from mathesar.examples.base import load_dataset_sql

MUSEUM_EXHIBITS_SCHEMA = "Museum Exhibits"
MUSEUM_EXHIBITS_SQL = "load_museum_exhibits.sql"


def load_museum_exhibits_dataset(conn):
    """Load the museum exhibits dataset."""
    load_dataset_sql(conn, MUSEUM_EXHIBITS_SCHEMA, MUSEUM_EXHIBITS_SQL)
