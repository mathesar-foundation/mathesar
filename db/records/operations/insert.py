import json

from db import connection as db_conn


def add_record_to_table(conn, record_def, table_oid, return_record_summaries=False):
    """Add a record to a table."""
    result = db_conn.exec_msar_func(
        conn,
        'add_record_to_table',
        table_oid,
        json.dumps(record_def),
        return_record_summaries
    ).fetchone()[0]
    return result
