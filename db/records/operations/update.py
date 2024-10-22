import json
from db import connection as db_conn


def patch_record_in_table(conn, record_def, record_id, table_oid, return_record_summaries=False):
    """Update a record in a table."""
    result = db_conn.exec_msar_func(
        conn,
        'patch_record_in_table',
        table_oid,
        record_id,
        json.dumps(record_def),
        return_record_summaries
    ).fetchone()[0]
    return result
