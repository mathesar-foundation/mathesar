from db.records import exceptions
from sqlalchemy.exc import ProgrammingError
from psycopg2.errors import UndefinedFunction


def execute_statement(engine, statement, connection_to_use=None):
    try:
        if connection_to_use:
            return connection_to_use.execute(statement)
        else:
            with engine.begin() as conn:
                return conn.execute(statement)
    except ProgrammingError as e:
        if isinstance(e.orig, UndefinedFunction):
            message = e.orig.args[0].split('\n')[0]
            raise exceptions.UndefinedFunction(message)
        else:
            raise e


def execute_query(engine, query, connection_to_use=None):
    return execute_statement(engine, query, connection_to_use=None).fetchall()
