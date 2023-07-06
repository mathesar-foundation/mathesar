from db.connection import execute_msar_func_with_engine


def add_constraint(constraint, engine):
    return execute_msar_func_with_engine(
        engine,
        'add_constraints',
        constraint.table_oid,
        constraint.get_constraint_def_json()
    ).fetchone()[0]
