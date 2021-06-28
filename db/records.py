import logging
from sqlalchemy import delete, select, and_, Column
from sqlalchemy.inspection import inspect
from sqlalchemy_filters import apply_filters

logger = logging.getLogger(__name__)


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
    )
    if filters:
        query = apply_filters(query, filters, table)
    with engine.begin() as conn:
        return conn.execute(query).fetchall()


def get_distinct_tuple_values(
        column_list, engine, table=None, limit=None, offset=None,
):
    """
    Returns distinct tuples from a given list of columns.

    Args:
        column_list: list of column names or SQLAlchemy column objects
        engine:   SQLAlchemy engine object
        table:    SQLAlchemy table object
        limit:    int, gives number of rows to return
        offset:   int, gives number of rows to skip

    If no table is given, the column_list must consist entirely of
    SQLAlchemy column objects associated with a table.
    """
    if table is not None:
        column_objects = [
            table.columns[col] if type(col) == str else col
            for col in column_list
        ]
    else:
        column_objects = column_list
    try:
        assert all([type(col) == Column for col in column_objects])
    except AssertionError as e:
        logger.error("All columns must be str or sqlalchemy.Column type")
        raise e

    query = (
        select(*column_objects)
        .distinct()
        .limit(limit)
        .offset(offset)
    )
    with engine.begin() as conn:
        res = conn.execute(query).fetchall()
    return [tuple(zip(column_objects, row)) for row in res]


def distinct_tuple_to_filter(distinct_tuple):
    filters = []
    for col, value in distinct_tuple:
        filters.append({
            "field": col,
            "op": "==",
            "value": value,
        })
    return filters


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


def create_records_from_csv(table, engine, csv_filename, column_names, delimiter=None,
                            escape=None, quote=None):
    with open(csv_filename, 'rb') as csv_file:
        with engine.begin() as conn:
            cursor = conn.connection.cursor()
            relation = '.'.join('"{}"'.format(part) for part in (table.schema, table.name))
            formatted_columns = '({})'.format(','.join([f'"{column_name}"' for column_name in column_names]))

            copy_sql = f'COPY {relation} {formatted_columns} FROM STDIN CSV HEADER'
            if delimiter:
                copy_sql += f" DELIMITER E'{delimiter}'"
            if escape:
                copy_sql += f" ESCAPE '{escape}'"
            if quote:
                if quote == "'":
                    quote = "''"
                copy_sql += f" QUOTE '{quote}'"

            cursor.copy_expert(copy_sql, csv_file)


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
