from db.connection import execute_msar_func_with_engine, exec_msar_func


def drop_constraint(table_name, schema_name, engine, constraint_name):
    """
    Drop a constraint.

    Args:
        table_name: The name of the table that has the constraint to be dropped.
        schema_name: The name of the schema where the table with constraint to be dropped resides.
        engine: SQLAlchemy engine object for connecting.
        constraint_name: The name of constraint to be dropped.

    Returns:
        Returns a string giving the command that was run.
    """
    return execute_msar_func_with_engine(
        engine, 'drop_constraint', schema_name, table_name, constraint_name
    ).fetchone()[0]


def drop_constraint_via_oid(table_oid, constraint_oid, conn):
    """
    Drop a constraint.

    Args:
        table_oid: Identity of the table to delete constraint for.
        constraint_oid: The OID of the constraint to delete.

    Returns:
        The name of the dropped constraint.
    """
    return exec_msar_func(
        conn, 'drop_constraint', table_oid, constraint_oid
    ).fetchone()[0]
