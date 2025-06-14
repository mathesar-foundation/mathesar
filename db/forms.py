import json
from db import connection as db_conn


def related_fields_exist(tab_attn_map, conn):
    """
    Utility function to determine that related form fields passed through the forms API actually exists on the db.

    tab_attn_map should have the following form:
    {
      "table_oid_1": [col_att1,col_att2,col_att3],
      "table_oid_2": [col_att1, col_att5]
    }
    """
    return db_conn.exec_msar_func(conn, 'related_fields_exist', json.dumps(tab_attn_map)).fetchone()[0]
