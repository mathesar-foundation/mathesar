import json

from db.connection import execute_msar_func_with_engine, exec_msar_func


def add_constraint_via_sql_alchemy(constraint_obj, engine):
    """
    Add a constraint.

    Args:
        constraint_obj: (See __msar.process_con_def_jsonb for details)
        engine: SQLAlchemy engine object for connecting.

    Returns:
        Returns a list of oid(s) of constraints for a given table.
    """
    return execute_msar_func_with_engine(
        engine,
        'add_constraints',
        constraint_obj.table_oid,
        constraint_obj.get_constraint_def_json()
    ).fetchone()[0]


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
