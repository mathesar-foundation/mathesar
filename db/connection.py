from psycopg.rows import dict_row


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


def select_from_msar_func_in_batch(conn, func_name, *args):
    # https://www.sqlines.com/postgresql/how-to/return_result_set_from_stored_procedure#:~:text=Both%20stored%20procedures%20and%20user,CREATE%20FUNCTION%20statement%20in%20PostgreSQL.&text=To%20return%20one%20or%20more,to%20use%20refcursor%20return%20type.&text=Important%20Note:%20The%20cursor%20remains,have%20to%20start%20a%20transaction.
    # https://www.psycopg.org/psycopg3/docs/basic/transactions.html
    # https://www.postgresql.org/docs/current/plpgsql-cursors.html
    with conn.transaction():
        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT msar.{func_name}({','.join(['%s'] * len(args))})", args
            )
            refcursor_name = cursor.fetchone()[0]
            fetch_query = f"FETCH FORWARD 1000 FROM \"{refcursor_name}\""

            while True:
                cursor.execute(fetch_query)
                rows = cursor.fetchall()
                if not rows:
                    break
                yield rows

            cursor.execute(f"CLOSE \"{refcursor_name}\"")
