from db.connection import exec_msar_func


def get_database(conn):
    return exec_msar_func(conn, 'get_current_database_info').fetchone()[0]
