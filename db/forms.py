import json
from db import connection as db_conn


def get_tab_col_info_map(tab_col_map, conn):
    """
    Returns table_info and column_info for a given tab_col_map.

    tab_col_map should have the following form:
    {
      "table_oid_1": [col_attnum_1, col_attnum_2, col_attnum_3],
      "table_oid_2": [col_attnum_4, col_attnum_5]
    }

    Returns:
    {
      "table_oid_1": {
        "table_info": table_info(),
        "columns": {"col_attnum_1": col_info(), "col_attnum_2": col_info(), "col_attnum_3": col_info()
      },
      "table_oid2": {
        "table_info": table_info(),
        "columns": {"col_attnum_4": col_info(), "col_attnum_5": col_info()}
      }
    }
    """
    return db_conn.exec_msar_func(conn, 'get_tab_col_info_map', json.dumps(tab_col_map)).fetchone()[0]
