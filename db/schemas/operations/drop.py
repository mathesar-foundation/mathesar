from db.connection import execute_msar_func_with_engine


def drop_schema(schema_name, engine, cascade=False, if_exists=False):
    """
    Drop a schema.

    Args:
        schema_name: Name of the schema to drop. 
        engine: SQLAlchemy engine object for connecting.
        cascade: Whether to drop the dependent objects.
        if_exists: Whether to ignore an error if the schema doesn't 
                   exist.

    Returns:
        Returns a string giving the command that was run.
    """
    execute_msar_func_with_engine(engine, 'drop_schema', schema_name, cascade, if_exists)
