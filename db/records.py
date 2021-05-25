from sqlalchemy import delete, select, and_
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


def get_records(
        table, engine, limit=None, offset=None, order_by=[], filters=[]
):
    """
    Returns records from a table.

    Args:
        table:    SQLAlchemy table object
        engine:   SQLAlchemy engine object
        limit:    int, gives number of rows to return
        offset:   int, gives number of rows to skip
        order_by: list of SQLAlchemy ColumnElements to order by.  Should
                  usually be either a list of string column names, or a
                  list of columns from the given table.
        filters:  list of tuples of type (ColumnElement, value), where
                  ColumnElement is an SQLAlchemy ColumnElement, and value
                  is a valid value for the associated column (i.e., the
                  type must be correct)
    """
    query = (
        select(table)
        .order_by(*order_by)
        .limit(limit)
        .offset(offset)
        .where(_build_filter_conjunction(table, filters))
    )
    with engine.begin() as conn:
        return conn.execute(query).fetchall()


def _build_filter_conjunction(table, filters):
    refined_filters = [
        (table.columns[col] if type(col) == str else col, value)
        for col, value in filters
    ]
    # We need a default of True (rather than empty), since invoking and_
    # without arguments is deprecated.
    return and_(True, *[col == value for col, value in refined_filters])


def create_record_or_records(table, engine, record_data):
    """
    record_data can be a dictionary, tuple, or list of dictionaries or tuples.
    if record_data is a list, it creates multiple records.
    """
    id_value = None
    with engine.begin() as connection:
        result = connection.execute(table.insert(), record_data)
        # If there was only a single record created, return the record.
        if result.rowcount == 1:
            # We need to manually commit insertion so that we can retrieve the record.
            connection.commit()
            id_value = result.inserted_primary_key[0]
            if id_value is not None:
                return get_record(table, engine, id_value)
    # Do not return any records if multiple rows were added.
    return None


def update_record(table, engine, id_value, record_data):
    primary_key_column = _get_primary_key_column(table)
    with engine.begin() as connection:
        connection.execute(
            table.update().where(primary_key_column == id_value).values(record_data)
        )
    return get_record(table, engine, id_value)


def delete_record(table, engine, id_value):
    primary_key_column = _get_primary_key_column(table)
    query = delete(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)
