import json

from db import connection as db_conn


def insert_from_select(
    conn,
    src_table_id,
    dst_table_id,
    mappings
):
    result = db_conn.exec_msar_func(
        conn,
        'insert_from_select',
        src_table_id,
        dst_table_id,
        json.dumps(mappings)
    ).fetchone()[0]
    return result
