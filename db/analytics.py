from db import connection as db_conn


def get_object_counts(conn):
    return db_conn.exec_msar_func(conn, 'get_object_counts').fetchone()[0]
