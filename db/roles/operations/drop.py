from db.connection import exec_msar_func


def drop_role(role_oid, conn):
    exec_msar_func(conn, 'drop_role', role_oid)
