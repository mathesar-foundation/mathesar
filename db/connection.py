from psycopg.rows import dict_row


def exec_msar_func(conn_or_cursor, func_name, *args):
    """
    Execute an msar function using a psycopg (3) connection or cursor.

    Args:
        conn_or_cursor: a psycopg connection or cursor
        func_name: The unqualified msar_function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    # Returns a cursor
    return conn_or_cursor.execute(
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


def select_from_db_cursor(cursor, refcursor_name, batch_size=2000):
    fetch_query = f"FETCH FORWARD {batch_size} FROM \"{refcursor_name}\""

    while True:
        cursor.execute(fetch_query)
        rows = cursor.fetchall()
        if not rows:
            break
        yield rows

    cursor.execute(f"CLOSE \"{refcursor_name}\"")
