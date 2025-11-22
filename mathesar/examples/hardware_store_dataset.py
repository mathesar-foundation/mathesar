from mathesar.examples.base import load_dataset_sql

HARDWARE_STORE_SCHEMA = "Hardware Store"
HARDWARE_STORE_SQL = "load_hardware_store.sql"


def load_hardware_store_dataset(conn):
    """Load the hardware store dataset."""
    load_dataset_sql(conn, HARDWARE_STORE_SCHEMA, HARDWARE_STORE_SQL)
