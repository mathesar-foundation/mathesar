import json
from db.connection import exec_msar_func


def replace_database_privileges_for_roles(conn, privileges):
    return exec_msar_func(
        conn, 'replace_database_privileges_for_roles', json.dumps(privileges)
    ).fetchone()[0]


def replace_schema_privileges_for_roles(conn, schema_oid, privileges):
    return exec_msar_func(
        conn, 'replace_schema_privileges_for_roles',
        schema_oid, json.dumps(privileges)
    ).fetchone()[0]
