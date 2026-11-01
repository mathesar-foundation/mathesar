import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from uuid import uuid4

from db.sql.install import get_jit_functions_sql


def _install_jit_if_needed(conn):
    if not getattr(conn, '_msar_functions_installed', False):
        cursor = conn.execute(get_jit_functions_sql())
        cursor.close()
        conn._msar_functions_installed = True


def exec_msar_func(conn, func_name, *args):
    if not getattr(conn, '_msar_functions_installed', False):
        functions_sql = get_jit_functions_sql()
        call = sql.SQL("SELECT pg_temp.{} ({})").format(
            sql.Identifier(func_name),
            sql.SQL(', ').join(sql.Literal(a) for a in args)
        )
        full_sql = functions_sql + "\n" + call.as_string(conn) + ";"
        result = conn.execute(full_sql)
        while result.nextset() is not None:
            pass
        conn._msar_functions_installed = True
        return result
    return conn.execute(
        f"SELECT pg_temp.{func_name}({','.join(['%s'] * len(args))})", args
    )


def exec_msar_func_server_cursor(conn, func_name, *args):
    _install_jit_if_needed(conn)
    server_cursor = conn.cursor(name=str(uuid4()))
    return server_cursor.execute(
        f"SELECT pg_temp.{func_name}({','.join(['%s'] * len(args))})", args
    )


def select_from_msar_func(conn, func_name, *args):
    if not getattr(conn, '_msar_functions_installed', False):
        functions_sql = get_jit_functions_sql()
        call = sql.SQL("SELECT * FROM pg_temp.{} ({})").format(
            sql.Identifier(func_name),
            sql.SQL(', ').join(sql.Literal(a) for a in args)
        )
        full_sql = functions_sql + "\n" + call.as_string(conn) + ";"
        cursor = conn.execute(full_sql)
        while cursor.nextset() is not None:
            pass
        conn._msar_functions_installed = True
    else:
        cursor = conn.execute(
            f"SELECT * FROM pg_temp.{func_name}({','.join(['%s'] * len(args))})", args
        )
    cursor.row_factory = dict_row
    return cursor.fetchall()


def load_file_with_conn(conn, file_handle):
    """Run an SQL script from a file, using psycopg."""
    conn.execute(file_handle.read())


def mathesar_connection(*args, **kwargs):
    kwargs.update(application_name="Mathesar " + kwargs.get("application_name", ""))
    return psycopg.connect(*args, **kwargs)
