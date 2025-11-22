from mathesar.examples.base import load_dataset_sql

ICE_CREAM_EMPLOYEES_SCHEMA = "Ice Cream Employee Management"
ICE_CREAM_EMPLOYEES_SQL = "load_ice_cream_employees.sql"


def load_ice_cream_employees_dataset(conn):
    """Load the ice cream management dataset."""
    load_dataset_sql(conn, ICE_CREAM_EMPLOYEES_SCHEMA, ICE_CREAM_EMPLOYEES_SQL)
