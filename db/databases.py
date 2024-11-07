from db.connection import exec_msar_func
from psycopg import sql


def get_database(conn):
    return exec_msar_func(conn, 'get_current_database_info').fetchone()[0]


def drop_database(database_oid, conn):
    cursor = conn.cursor()
    conn.autocommit = True
    drop_database_query = exec_msar_func(
        conn,
        'drop_database_query',
        database_oid
    ).fetchone()[0]
    cursor.execute(sql.SQL(drop_database_query))
    cursor.close()
    conn.autocommit = False


def create_database(database_name, conn):
    """Use the given connection to create a database."""
    conn.autocommit = True
    conn.execute(
        sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database_name))
    )
    conn.autocommit = False
