from db.connection import execute_msar_func_with_engine

def drop_schema(schema, engine, cascade=False, if_exists=False):
    """
    This method deletes a Postgres schema.
    """
    execute_msar_func_with_engine(engine, 'drop_schema', schema, cascade, if_exists)
