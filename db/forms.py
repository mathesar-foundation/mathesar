import json
from db import connection as db_conn


def get_tab_col_con_info_map(tab_col_con_map, conn):
    """
      Returns table_info, column_info, and constraints_info for a given tab_col_con_map.

      tab_col_con_map should have the following form:
      {
        "tables": {
          "table_oid_1": [col_attnum_1, col_attnum_2, col_attnum_3],
          "table_oid_2": [col_attnum_4, col_attnum_5]
        },
        "constraints": [cons_oid_1, cons_oid_2]
      }

      Returns:
      {
        "tables": {
          "table_oid_1": {
            "table_info": table_info(),
            "columns": {"col_attnum_1": col_info(), "col_attnum_2": col_info(), "col_attnum_3": col_info()
            }
          },
          "table_oid2": {
            "table_info": table_info(),
            "columns": {"col_attnum_4": col_info(), "col_attnum_5": col_info()}
          }
        },
        "constraints": {"cons_oid1": cons_info(), "cons_oid2": cons_info()}
      }
    """
    return db_conn.exec_msar_func(conn, 'get_tab_col_con_info_map', json.dumps(tab_col_con_map)).fetchone()[0]
