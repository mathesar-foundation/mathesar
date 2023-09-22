from sqlalchemy import text
import psycopg
import json


def execute_msar_func_with_engine(engine, func_name, *parameters):
    """
    Execute an msar function using an SQLAlchemy engine.

    This is temporary scaffolding.

    Args:
        engine: an SQLAlchemy engine for connecting to a DB
        func_name: The unqualified msar function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    conn_str = str(engine.url)
    statement, parameters = _get_parametrized_statement_and_parameters(
        func_name, parameters
    )
    with psycopg.connect(conn_str) as conn:
        # Returns a cursor
        return conn.execute(statement, parameters)


def execute_msar_func_with_psycopg2_conn(conn, func_name, *parameters):
    """
    Execute an msar function using an SQLAlchemy engine.

    This is *extremely* temporary scaffolding.

    Args:
        conn: a psycopg2 connection (from an SQLAlchemy engine)
        func_name: The unqualified msar function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    statement, parameters = _get_parametrized_statement_and_parameters(
        func_name, parameters
    )
    # Returns a cursor
    return conn.execute(statement, parameters)


#TODO document
def _get_parametrized_statement_and_parameters(func_name, parameters):
    parameter_placeholders = ','.join(
        ['%s'] * len(parameters)
    )
    statement = f"SELECT msar.{func_name}({parameter_placeholders})"
    adapted_parameters = _adapt_parameters(parameters)
    return statement, adapted_parameters


def _adapt_parameters(args):
    """
    Processes parameters, serializing dicts and lists into JSON strings.
    """
    return [
        json.dumps(arg)
        if type(arg) is dict or type(arg) is list
        else arg
        for arg
        in args
    ]


def load_file_with_engine(engine, file_handle):
    """Run an SQL script from a file, using psycopg."""
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        conn.execute(file_handle.read())
