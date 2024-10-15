from db.connection import execute_msar_func_with_engine, exec_msar_func


def drop_table(name, schema, engine, cascade=False, if_exists=False):
    execute_msar_func_with_engine(engine, 'drop_table', schema, name, cascade, if_exists)


def drop_table_from_database(table_oid, conn, cascade=False):
    """
    Drop a table.

    Args:
        table_oid: OID of the table to drop.
        cascade: Whether to drop the dependent objects.

    Returns:
        Returns the fully qualified name of the dropped table.
    """
    return exec_msar_func(
        conn, 'drop_table', table_oid, cascade
    ).fetchone()[0]
