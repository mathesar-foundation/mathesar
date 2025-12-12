import json

from db import connection as db_conn


def list_roles(conn):
    return db_conn.exec_msar_func(conn, 'list_roles').fetchone()[0]


def get_current_role_from_db(conn):
    return db_conn.exec_msar_func(conn, 'get_current_role').fetchone()[0]


def list_db_priv(conn):
    return db_conn.exec_msar_func(conn, 'list_db_priv').fetchone()[0]


def list_schema_privileges(schema_oid, conn):
    return db_conn.exec_msar_func(
        conn, 'list_schema_privileges', schema_oid
    ).fetchone()[0]


def list_table_privileges(table_oid, conn):
    return db_conn.exec_msar_func(
        conn, 'list_table_privileges', table_oid
    ).fetchone()[0]


def create_role(rolename, password, login, conn):
    return db_conn.exec_msar_func(
        conn, 'create_role', rolename, password, login
    ).fetchone()[0]


def drop_role(role_oid, conn):
    db_conn.exec_msar_func(conn, 'drop_role', role_oid)


def set_members_to_role(parent_role_oid, members, conn):
    return db_conn.exec_msar_func(
        conn, 'set_members_to_role', parent_role_oid, members
    ).fetchone()[0]


def transfer_database_ownership(new_owner_oid, conn):
    return db_conn.exec_msar_func(
        conn, 'transfer_database_ownership', new_owner_oid
    ).fetchone()[0]


def transfer_schema_ownership(schema_oid, new_owner_oid, conn):
    return db_conn.exec_msar_func(
        conn, 'transfer_schema_ownership', schema_oid, new_owner_oid
    ).fetchone()[0]


def transfer_table_ownership(table_oid, new_owner_oid, conn):
    return db_conn.exec_msar_func(
        conn, 'transfer_table_ownership', table_oid, new_owner_oid
    ).fetchone()[0]


def replace_database_privileges_for_roles(conn, privileges):
    return db_conn.exec_msar_func(
        conn, 'replace_database_privileges_for_roles', json.dumps(privileges)
    ).fetchone()[0]


def replace_schema_privileges_for_roles(conn, schema_oid, privileges):
    return db_conn.exec_msar_func(
        conn, 'replace_schema_privileges_for_roles',
        schema_oid, json.dumps(privileges)
    ).fetchone()[0]


def replace_table_privileges_for_roles(conn, table_oid, privileges):
    return db_conn.exec_msar_func(
        conn, 'replace_table_privileges_for_roles',
        table_oid, json.dumps(privileges)
    ).fetchone()[0]
