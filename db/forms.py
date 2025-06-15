import json
from db import connection as db_conn


def fields_exist(tab_attn_map, conn):
    """
    Utility function to determine that form fields passed through the forms API actually exists on the db.

    tab_attn_map should have the following form:
    {
      "table_oid_1": [col_att1,col_att2,col_att3],
      "table_oid_2": [col_att1, col_att5]
    }
    """
    return db_conn.exec_msar_func(conn, 'fields_exist', json.dumps(tab_attn_map)).fetchone()[0]


def get_oid_col_info_map(tab_attn_map, conn):
    """
    Returns column_info for a given oid_attn_map.

    oid_attn_map should have the following form:
    {
      "table_oid_1": [col_att1,col_att2,col_att3],
      "table_oid_2": [col_att1, col_att5]
    }

    Returns:
    {
      "table_oid_1": {"col_att1": col_info(), "col_att2": col_info(), "col_att3": col_info()},
      "table_oid_2": {"col_att1": col_info(), "col_att5": col_info()}
    }
    """
    return db_conn.exec_msar_func(conn, 'get_oid_col_info_map', json.dumps(tab_attn_map)).fetchone()[0]
