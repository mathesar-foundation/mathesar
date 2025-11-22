from mathesar.examples.base import load_dataset_sql

NONPROFIT_GRANTS_SCHEMA = "Nonprofit Grant Tracking"
NONPROFIT_GRANTS_SQL = "load_nonprofit_grants.sql"


def load_nonprofit_grants_dataset(conn):
    """Load the museum exhibits dataset."""
    load_dataset_sql(conn, NONPROFIT_GRANTS_SCHEMA, NONPROFIT_GRANTS_SQL)
