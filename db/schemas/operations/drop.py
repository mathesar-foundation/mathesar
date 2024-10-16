from db.connection import execute_msar_func_with_engine, exec_msar_func


# TODO Remove (only used in testing)
def drop_schema_via_name(engine, name, cascade=False):
    """
    Drop a schema by its name.

    If no schema exists with the given name, an exception will be raised.

    Deprecated:
        Use drop_schema_via_oid instead. This function is deprecated because we
        are phasing out name-based operations in favor of OID-based operations
        and we are phasing out SQLAlchemy in favor of psycopg.

    Args:
        engine: SQLAlchemy engine object for connecting. name: Name of the
        schema to drop. cascade: Whether to drop the dependent objects.
    """
    execute_msar_func_with_engine(engine, 'drop_schema', name, cascade).fetchone()


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
