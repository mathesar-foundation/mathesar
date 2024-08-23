from db.connection import exec_msar_func


def create_role(rolename, password, login, conn):
    return exec_msar_func(conn, 'create_role', rolename, password, login).fetchone()[0]
