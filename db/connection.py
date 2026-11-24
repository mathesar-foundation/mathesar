import psycopg
from psycopg.rows import dict_row
from uuid import uuid4


def exec_msar_func(conn, func_name, *args):
    """
    Execute an msar function using a psycopg (3) connection.

    Args:
        conn: a psycopg connection or cursor
        func_name: The unqualified msar_function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    # Returns a cursor
    return conn.execute(
        f"SELECT msar.{func_name}({','.join(['%s'] * len(args))})", args
    )


def exec_msar_func_with_param_types(conn, func_name, param_types, *args):
    """
    Execute an msar function using explicit PostgreSQL casts for parameters.

    Args:
        conn: a psycopg connection or cursor
        func_name: The unqualified msar_function name (danger; not sanitized)
        param_types: The list of PostgreSQL type names used to cast each parameter.
        *args: The list of parameters to pass
    """
    placeholders = [
        f"%s::{param_type}" if param_type else "%s"
        for param_type in param_types
    ]
    return conn.execute(
        f"SELECT msar.{func_name}({','.join(placeholders)})", args
    )


def exec_msar_func_server_cursor(conn, func_name, *args):
    """
    Execute an msar function using a psycopg (3) connection and a server cursor.

    Args:
        conn: a psycopg connection or cursor
        func_name: The unqualified msar_function name (danger; not sanitized)
        *args: The list of parameters to pass

    Note:
        The server cursor must be properly closed during usage.
        Use the pattern:
            with connection.exec_msar_func_server_cursor(...) as cursor:
            ...
        since the with statement automatically closes the cursor.
    """
    server_cursor = conn.cursor(name=str(uuid4()))
    return server_cursor.execute(
        f"SELECT msar.{func_name}({','.join(['%s'] * len(args))})", args
    )


def select_from_msar_func(conn, func_name, *args):
    """
    Select all records from an msar function using a psycopg (3) connection.

    Args:
        conn: a psycopg connection
        func_name: The unqualified msar_function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    cursor = conn.execute(
        f"SELECT * FROM msar.{func_name}({','.join(['%s'] * len(args))})", args
    )
    cursor.row_factory = dict_row
    return cursor.fetchall()


def load_file_with_conn(conn, file_handle):
    """Run an SQL script from a file, using psycopg."""
    conn.execute(file_handle.read())


def mathesar_connection(*args, **kwargs):
    """
    All Mathesar psycopg connections should use this function. It adds an
    application_name to each connection (prepending any previously-set
    application name). This is visible in the `pg_stat_activity` table,
    useful for debugging (and perhaps required by some DBAs).
    """
    kwargs.update(application_name="Mathesar " + kwargs.get("application_name", ""))
    return psycopg.connect(*args, **kwargs)
