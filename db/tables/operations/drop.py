from db.connection import execute_msar_func_with_engine


def drop_table(name, schema, engine, cascade=False, if_exists=False):
    execute_msar_func_with_engine(engine, 'drop_table', schema, name, cascade, if_exists)
