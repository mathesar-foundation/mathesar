from sqlalchemy import delete, select
from sqlalchemy.inspection import inspect


def _get_primary_key_column(table):
    primary_key_list = list(inspect(table).primary_key)
    # We do not support getting by composite primary keys
    assert len(primary_key_list) == 1
    return primary_key_list[0]


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


def create_records(table, engine, record_data):
    """
    records can be a dictionary, tuple, or list of dictionaries or tuples.
    """
    id_value = None
    with engine.begin() as connection:
        result = connection.execute(table.insert(), record_data)
        if result.rowcount == 1:
            id_value = result.inserted_primary_key[0]
    if id_value:
        return get_record(table, engine, id_value)
    # Do not return any records if multiple rows were added.
    return None


def delete_record(table, engine, id_value):
    primary_key_column = _get_primary_key_column(table)
    query = delete(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)
