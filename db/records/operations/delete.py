import json

from db import connection as db_conn


def delete_records_from_table(conn, record_ids, table_oid):
    """
    Delete records from table by id.

    Args:
        tab_id: The OID of the table whose record we'll delete.
        record_ids: A list of primary values

    The table must have a single primary key column.
    """
    return db_conn.exec_msar_func(
        conn,
        'delete_records_from_table',
        table_oid,
        json.dumps(record_ids),
    ).fetchone()[0]
