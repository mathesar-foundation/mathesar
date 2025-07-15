import json
from db import connection as db_conn


def get_info_for_table_col_cons_map(table_col_cons_map, conn):
    """
    Returns table_info, column_info, and constraints_info for a given table_col_cons_map.

    table_col_cons_map should have the following form:
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
          "columns": {
            "col_attnum_1": col_info(),
            "col_attnum_2": col_info(),
            "col_attnum_3": col_info()
          }
        },
        "table_oid2": {
          "table_info": table_info(),
          "columns": {
            "col_attnum_4": col_info(),
            "col_attnum_5": col_info()
          }
        }
      },
      "constraints": {
        "cons_oid1": cons_info(),
        "cons_oid2": cons_info()
      }
    }
    """
    return db_conn.exec_msar_func(conn, 'get_info_for_table_col_cons_map', json.dumps(table_col_cons_map)).fetchone()[0]
