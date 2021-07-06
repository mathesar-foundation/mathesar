import logging
from sqlalchemy import delete, select, Column, func
from sqlalchemy.inspection import inspect
from sqlalchemy_filters import apply_filters, apply_sort
from sqlalchemy_filters.exceptions import FieldNotFound

from db.constants import ID

logger = logging.getLogger(__name__)


# Grouping exceptions follow the sqlalchemy_filters exceptions patterns
class BadGroupFormat(Exception):
    pass


class GroupFieldNotFound(FieldNotFound):
    pass


def _get_primary_key_column(table):
    primary_key_list = list(inspect(table).primary_key)
    # We do not support getting by composite primary keys
    assert len(primary_key_list) == 1
    return primary_key_list[0]


def _create_col_objects(table, column_list):
    return [
        table.columns[col] if type(col) == str else col
        for col in column_list
    ]


def get_record(table, engine, id_value):
    primary_key_column = _get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    with engine.begin() as conn:
        result = conn.execute(query).fetchall()
        assert len(result) <= 1
        return result[0] if result else None


def get_records(
        table, engine, limit=None, offset=None, order_by=[], filters=[],
):
    """
    Returns records from a table.

    Args:
        table:    SQLAlchemy table object
        engine:   SQLAlchemy engine object
        limit:    int, gives number of rows to return
        offset:   int, gives number of rows to skip
        order_by: list of dictionaries, where each dictionary has a 'field' and
                  'direction' field.
                  See: https://github.com/centerofci/sqlalchemy-filters#sort-format
        filters:  list of dictionaries, where each dictionary has a 'field' and 'op'
                  field, in addition to an 'value' field if appropriate.
                  See: https://github.com/centerofci/sqlalchemy-filters#filters-format
    """
    query = select(table).limit(limit).offset(offset)
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        query = apply_filters(query, filters)
    with engine.begin() as conn:
        return conn.execute(query).fetchall()


def get_group_counts(
        table, engine, group_by, limit=None, offset=None, order_by=[], filters=[],
):
    """
    Returns counts by specified groupings

    Args:
        table:    SQLAlchemy table object
        engine:   SQLAlchemy engine object
        limit:    int, gives number of rows to return
        offset:   int, gives number of rows to skip
        group_by: list or tuple of column names or column objects to group by
        order_by: list of dictionaries, where each dictionary has a 'field' and
                  'direction' field.
                  See: https://github.com/centerofci/sqlalchemy-filters#sort-format
        filters:  list of dictionaries, where each dictionary has a 'field' and 'op'
                  field, in addition to an 'value' field if appropriate.
                  See: https://github.com/centerofci/sqlalchemy-filters#filters-format
    """
    if type(group_by) not in (tuple, list):
        raise BadGroupFormat(f"Group spec {group_by} must be list or tuple.")
    for field in group_by:
        if type(field) not in (str, Column):
            raise BadGroupFormat(f"Group field {field} must be a string or Column.")
        field_name = field if type(field) == str else field.name
        if field_name not in table.c:
            raise GroupFieldNotFound(f"Group field {field} not found in {table}.")

    group_by = _create_col_objects(table, group_by)
    query = (
        select(*group_by, func.count(table.c[ID]))
        .group_by(*group_by)
        .limit(limit)
        .offset(offset)
    )
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        query = apply_filters(query, filters)
    with engine.begin() as conn:
        records = conn.execute(query).fetchall()

    # Last field is the count, preceding fields are the group by fields
    counts = {
        (*record[:-1],): record[-1]
        for record in records
    }
    return counts


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
        column_objects = _create_col_objects(table, column_list)
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


def distinct_tuples_to_filter(distinct_tuples):
    filters = []
    for col, value in distinct_tuples:
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
