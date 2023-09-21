from db import connection as db_conn


def bulk_paste_records(table_oid, updates, inserts, engine):
    db_conn.execute_msar_func_with_engine(
        engine, 'bulk_paste_records', table_oid, updates, inserts
    )
