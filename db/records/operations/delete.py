import json
from sqlalchemy import delete

from db import connection as db_conn
from db.tables.utils import get_primary_key_column


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


def delete_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = delete(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)


def bulk_delete_records(table, engine, id_values):
    primary_key_column = get_primary_key_column(table)
    query = delete(table).where(primary_key_column.in_(id_values))
    with engine.begin() as conn:
        return conn.execute(query)
