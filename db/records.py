from sqlalchemy import delete, select
from sqlalchemy.inspection import inspect


def _get_primary_key_column(table):
    primary_key_list = list(inspect(table).primary_key)
    # We do not support getting by composite primary keys
    assert len(primary_key_list) == 1
    return primary_key_list[0]


def create_records(table, engine, record_data):
    """
    records can be a dictionary, tuple, or list of dictionaries or tuples.
    """
    with engine.begin() as connection:
        result = connection.execute(table.insert(), record_data)
        return result


def delete_record(table, engine, id_value):
    primary_key_column = _get_primary_key_column(table)
    query = delete(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)


def get_record(table, engine, id_value):
    primary_key_column = _get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        result = conn.execute(query).fetchall()
        assert len(result) <= 1
        return result[0] if result else None


def get_records(table, engine, limit=None, offset=None):
    query = select(table).limit(limit).offset(offset)
    with engine.begin() as conn:
        return conn.execute(query).fetchall()
