from db.connection import exec_msar_func


def replace_database_privileges_for_roles(conn, privilege_spec):
    return exec_msar_func(
        conn, 'replace_database_privileges_for_roles', privilege_spec
    ).fetchone()[0]
