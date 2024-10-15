from db.connection import exec_msar_func


def set_members_to_role(parent_role_oid, members, conn):
    return exec_msar_func(conn, 'set_members_to_role', parent_role_oid, members).fetchone()[0]
