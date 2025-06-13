import json
from db import connection as db_conn


def related_fields_exist(tab_attn_map, conn):
    return db_conn.exec_msar_func(conn, 'related_fields_exist', json.dumps(tab_attn_map)).fetchone()[0]
