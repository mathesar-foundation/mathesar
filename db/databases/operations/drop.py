from db.connection import exec_msar_func


def drop_database(database_oid, conn):
    exec_msar_func(conn, 'drop_database', database_oid)
