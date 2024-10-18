from db.connection import exec_msar_func


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
