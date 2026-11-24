import os

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


def _install_sql_file(file_name):
    def _install(conn):
        from db.connection import load_file_with_conn
        with open(os.path.join(FILE_DIR, file_name), 'rb') as file_handle:
            load_file_with_conn(conn, file_handle)

    return _install


def uninstall(
        conn,
        schemas_to_remove=['msar', '__msar', 'mathesar_types'],
        strict=True
):
    """Remove msar and __msar schemas safely."""
    from db.connection import exec_msar_func
    _install_sql_file("00_msar_all_objects_table.sql")(conn)
    _install_sql_file("02_msar_remove.sql")(conn)
    exec_msar_func(
        conn,
        "drop_all_msar_objects",
        schemas_to_remove,
        True,
        strict,
    )


JIT_FILE_NAMES = [
    "05_msar.sql",
    "10_msar_joinable_tables.sql",
    "30_msar_custom_aggregates.sql",
    "45_msar_type_casting.sql",
    "46_msar_type_inference.sql",
]

_JIT_FUNCTIONS_SQL = None


def get_jit_functions_sql():
    global _JIT_FUNCTIONS_SQL
    if _JIT_FUNCTIONS_SQL is None:
        parts = []
        for file_name in JIT_FILE_NAMES:
            with open(os.path.join(FILE_DIR, file_name)) as f:
                parts.append(f.read())
        parts.append("GRANT SELECT ON ALL TABLES IN SCHEMA pg_temp TO PUBLIC;")
        _JIT_FUNCTIONS_SQL = "\n".join(parts)
    return _JIT_FUNCTIONS_SQL


def install_mathesar_types(conn):
    """Install only the permanent mathesar_types schema and types."""
    _install_sql_file("01_msar_types.sql")(conn)
