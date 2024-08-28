from db.connection import exec_msar_func


def list_roles(conn):
    return exec_msar_func(conn, 'list_roles').fetchone()[0]


def list_db_priv(db_name, conn):
    return exec_msar_func(conn, 'list_db_priv', db_name).fetchone()[0]


def list_schema_privileges(schema_oid, conn):
    return exec_msar_func(conn, 'list_schema_privileges', schema_oid).fetchone()[0]


def list_table_privileges(table_oid, conn):
    return exec_msar_func(conn, 'list_table_privileges', table_oid).fetchone()[0]


def get_curr_role_db_priv(conn):
    db_info = exec_msar_func(conn, 'get_current_database_info').fetchone()[0]
    return {
        "owner_oid": db_info["owner_oid"],
        "current_role_priv": db_info["current_role_priv"],
        "current_role_owns": db_info["current_role_owns"],
    }
