from db.connection import execute_msar_func_with_engine


def drop_schema(schema_name, engine, cascade=False, if_exists=False):
    """
    This method deletes a Postgres schema.
    """
    execute_msar_func_with_engine(engine, 'drop_schema', schema_name, cascade, if_exists)
