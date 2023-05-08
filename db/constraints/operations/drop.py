from db.connection import execute_msar_func_with_engine


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
