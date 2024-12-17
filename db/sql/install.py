import os

from db.connection import load_file_with_conn

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def _install_sql_file(file_name):
    """
    Return a function that installs the SQL file with the given name. The
    returned function accepts a psycopg connection as its only argument.
    """

    def _install(conn):
        with open(os.path.join(FILE_DIR, file_name)) as file_handle:
            load_file_with_conn(conn, file_handle)

    return _install


INSTALL_STEPS = [
    _install_sql_file("01_msar_remove.sql"),
    _install_sql_file("05_msar.sql"),
    _install_sql_file("10_msar_joinable_tables.sql"),
    _install_sql_file("30_msar_custom_aggregates.sql"),
    _install_sql_file("40_msar_types.sql"),
    _install_sql_file("50_msar_permissions.sql"),
]


def install(conn):
    """Install SQL pieces using the given conn."""
    for step in INSTALL_STEPS:
        step(conn)
