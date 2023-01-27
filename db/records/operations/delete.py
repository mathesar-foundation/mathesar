from sqlalchemy import delete

from db.tables.utils import get_primary_key_column


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