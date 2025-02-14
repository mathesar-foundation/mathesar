import os

from db.connection import load_file_with_conn, exec_msar_func

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def _install_sql_file(file_name):
    """
    Return a function that installs the SQL file with the given name. The
    returned function accepts a psycopg connection as its only argument.
    """

    def _install(conn):
        with open(os.path.join(FILE_DIR, file_name), 'r') as file_handle:
            load_file_with_conn(conn, file_handle)

    return _install


INSTALL_STEPS = [
    _install_sql_file("00_msar_all_objects_table.sql"),
    _install_sql_file("01_msar_types.sql"),
    _install_sql_file("02_msar_remove.sql"),
    _install_sql_file("05_msar.sql"),
    _install_sql_file("10_msar_joinable_tables.sql"),
    _install_sql_file("30_msar_custom_aggregates.sql"),
    _install_sql_file("45_msar_type_casting.sql"),
    _install_sql_file("50_msar_permissions.sql"),
]


def install(conn):
    """Install SQL pieces using the given conn."""
    for step in INSTALL_STEPS:
        step(conn)


def uninstall(
        conn,
        schemas_to_remove=['msar', '__msar', 'mathesar_types'],
        strict=True
):
    """Remove msar and __msar schemas safely."""
    _install_sql_file("00_msar_all_objects_table.sql")(conn)
    _install_sql_file("02_msar_remove.sql")(conn)
    exec_msar_func(
        conn,
        "drop_all_msar_objects",
        schemas_to_remove,
        True,
        strict,
    )
