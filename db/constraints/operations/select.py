from db.connection import select_from_msar_func


def get_constraints_for_table(table_oid, conn):
    return select_from_msar_func(conn, 'get_constraints_for_table', table_oid)
