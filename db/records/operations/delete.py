from sqlalchemy import delete

from db.tables.utils import get_primary_key_column


def delete_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = delete(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)
