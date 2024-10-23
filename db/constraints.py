import json

from db.connection import exec_msar_func
from db.connection import select_from_msar_func


def get_constraints_for_table(table_oid, conn):
    return select_from_msar_func(conn, 'get_constraints_for_table', table_oid)


def create_constraint(table_oid, constraint_obj_list, conn):
    """
    Create a constraint using a psycopg connection.

    Args:
        constraint_obj_list: (See __msar.process_con_def_jsonb for details)
        conn: a psycopg connection

    Returns:
        Returns a list of oid(s) of constraints for a given table.
    """
    return exec_msar_func(
        conn, 'add_constraints', table_oid, json.dumps(constraint_obj_list)
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
