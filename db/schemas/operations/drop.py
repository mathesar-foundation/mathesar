from db.connection import exec_msar_func


def drop_schema_via_oid(conn, id, cascade=False):
    """
    Drop a schema by its OID.

    If no schema exists with the given oid, an exception will be raised.

    Args:
        conn: a psycopg connection
        id: the OID of the schema to drop.
        cascade: Whether to drop the dependent objects.
    """
    exec_msar_func(conn, 'drop_schema', id, cascade).fetchone()
