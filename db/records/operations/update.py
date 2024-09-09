import json
from db import connection as db_conn
from db.records.operations.select import get_record
from db.tables.utils import get_primary_key_column
from sqlalchemy.exc import DataError
from psycopg2.errors import DatetimeFieldOverflow, InvalidDatetimeFormat
from db.records.exceptions import InvalidDate, InvalidDateFormat


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


def update_record(table, engine, id_value, record_data):
    primary_key_column = get_primary_key_column(table)
    with engine.begin() as connection:
        try:
            connection.execute(
                table.update().where(primary_key_column == id_value).values(record_data)
            )
        except DataError as e:
            if type(e.orig) is DatetimeFieldOverflow:
                raise InvalidDate
            elif type(e.orig) is InvalidDatetimeFormat:
                raise InvalidDateFormat
            else:
                raise e
    return get_record(table, engine, id_value)
