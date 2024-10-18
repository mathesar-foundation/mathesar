import json

from db.connection import exec_msar_func


def create_constraint(table_oid, constraint_obj_list, conn):
    """
    Create a constraint using a psycopg connection.

    Args:
        constraint_obj_list: (See __msar.process_con_def_jsonb for details)
        conn: a psycopg connection

    Returns:
        Returns a list of oid(s) of constraints for a given table.
    """
    return exec_msar_func(conn, 'add_constraints', table_oid, json.dumps(constraint_obj_list)).fetchone()[0]
