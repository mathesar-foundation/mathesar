from db.connection import exec_msar_func


def list_schemas(conn):
    return exec_msar_func(conn, 'list_schemas').fetchone()[0]


def get_schema(schema_oid, conn):
    return exec_msar_func(conn, 'get_schema').fetchone()[0]
