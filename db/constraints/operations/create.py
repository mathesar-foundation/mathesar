from db.connection import execute_msar_func_with_engine


def add_constraint(constraint_obj, engine):
    """
    Add a constraint.

    Args:
        constraint_obj: A constraint object instantiatated with appropriate
                        params.
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
