from sqlalchemy import text
import psycopg


def execute_msar_func_with_engine(engine, func_name, *args):
    """
    Execute an msar function using an SQLAlchemy engine.

    This is temporary scaffolding.

    Args:
        engine: an SQLAlchemy engine for connecting to a DB
        func_name: The unqualified msar function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        # Returns a cursor
        return conn.execute(
            f"SELECT msar.{func_name}({','.join(['%s']*len(args))})",
            args
        )


def execute_msar_func_with_psycopg2_conn(conn, func_name, *args):
    """
    Execute an msar function using an SQLAlchemy engine.

    This is *extremely* temporary scaffolding.

    Args:
        conn: a psycopg2 connection (from an SQLAlchemy engine)
        func_name: The unqualified msar function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    args_str = ", ".join([str(arg) for arg in args])
    args_str = f"{args_str}"
    stmt = text(f"SELECT msar.{func_name}({args_str})")
    # Returns a cursor
    return conn.execute(stmt)


def exec_msar_func(conn, func_name, *args):
    """
    Execute an msar function using a psycopg (3) connection.

    Args:
        conn: a psycopg connection
        func_name: The unqualified msar_function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    # Returns a cursor
    return conn.execute(
        f"SELECT msar.{func_name}({','.join(['%s']*len(args))})", args
    )


def load_file_with_engine(engine, file_handle):
    """Run an SQL script from a file, using psycopg."""
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        conn.execute(file_handle.read())
