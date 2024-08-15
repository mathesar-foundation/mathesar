from db.connection import exec_msar_func


def get_roles(conn):
    return exec_msar_func(conn, 'get_roles').fetchone()[0]


def list_db_priv(db_name, conn):
    return exec_msar_func(conn, 'list_db_priv', db_name).fetchone()[0]


def get_curr_role_db_priv(db_name, conn):
    return exec_msar_func(conn, 'get_owner_oid_and_curr_role_db_priv', db_name).fetchone()[0]
