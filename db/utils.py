def execute_statement(engine, statement, connection_to_use=None):
    if connection_to_use:
        return connection_to_use.execute(statement)
    else:
        with engine.begin() as conn:
            return conn.execute(statement)
