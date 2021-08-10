import logging
from sqlalchemy import delete, select, Column, func
from sqlalchemy.inspection import inspect
from sqlalchemy_filters import apply_filters, apply_sort
from sqlalchemy_filters.exceptions import FieldNotFound


logger = logging.getLogger(__name__)


# Grouping exceptions follow the sqlalchemy_filters exceptions patterns
class BadGroupFormat(Exception):
    pass


class GroupFieldNotFound(FieldNotFound):
    pass


class NotUniquePrimaryKey(Exception):
    pass


def _get_primary_key_columns(table):
    return list(inspect(table).primary_key)


def _get_primary_key_column(table, idx):
    primary_key_columns = _get_primary_key_columns(table)
    return primary_key_columns[idx]


def _create_col_objects(table, column_list):
    return [
        table.columns[col] if type(col) == str else table.columns[col.name]
        for col in column_list
    ]


def _get_query(table, limit, offset, order_by, filters):
    query = select(table).limit(limit).offset(offset)
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        query = apply_filters(query, filters)
    return query


def _execute_query(query, engine):
    with engine.begin() as conn:
        records = conn.execute(query).fetchall()
        return records


def get_record(table, engine, id_value):
    primary_key_columns = _get_primary_key_columns(table)

    if len(primary_key_columns) != 1:
        raise NotUniquePrimaryKey("This table does not have a unique primary key.")

    query = select(table).where(primary_key_columns[0] == id_value)
    result = _execute_query(query, engine)
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
    if not order_by:
        # Set default ordering if none was requested
        if len(table.primary_key.columns) > 0:
            # If there are primary keys, order by all primary keys
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.primary_key.columns]
        else:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.columns]

    query = _get_query(table, limit, offset, order_by, filters)
    return _execute_query(query, engine)


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

    table_columns = _create_col_objects(table, group_by)
    count_query = (
        select(*table_columns, func.count(table_columns[0]))
        .group_by(*table_columns)
    )
    if filters is not None:
        count_query = apply_filters(count_query, filters)
    filtered_count_query = _get_filtered_group_by_count_query(
        table, engine, group_by, limit, offset, order_by, filters, count_query
    )
    if filtered_count_query is not None:
        records = _execute_query(filtered_count_query, engine)
        # Last field is the count, preceding fields are the group by fields
        counts = {(*record[:-1],): record[-1] for record in records}
    else:
        counts = {}
    return counts


def _get_filtered_group_by_count_query(
        table, engine, group_by, limit, offset, order_by, filters, count_query
):
    # Get the list of groups that we should count.
    # We're considering limit and offset here so that we only count relevant groups
    relevant_subtable_query = _get_query(table, limit, offset, order_by, filters)
    relevant_subtable_cte = relevant_subtable_query.cte()
    cte_columns = _create_col_objects(relevant_subtable_cte, group_by)
    distinct_tuples = get_distinct_tuple_values(cte_columns, engine, output_table=table)
    if distinct_tuples:
        limited_filters = [
            {
                "or": [
                    distinct_tuples_to_filter(distinct_tuple_spec)
                    for distinct_tuple_spec in distinct_tuples
                ]
            }
        ]
        filtered_count_query = apply_filters(count_query, limited_filters)
    else:
        filtered_count_query = None
    return filtered_count_query


def get_distinct_tuple_values(
        column_list, engine, table=None, limit=None, offset=None, output_table=None
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
    result = _execute_query(query, engine)
    if output_table is not None:
        column_objects = [output_table.columns[col.name] for col in column_objects]
    return [tuple(zip(column_objects, row)) for row in result]


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


def create_records_from_csv(
        table,
        engine,
        csv_filename,
        column_names,
        header,
        delimiter=None,
        escape=None,
        quote=None,
):
    with open(csv_filename, 'rb') as csv_file:
        with engine.begin() as conn:
            cursor = conn.connection.cursor()
            relation = '.'.join('"{}"'.format(part) for part in (table.schema, table.name))
            formatted_columns = '({})'.format(','.join([f'"{column_name}"' for column_name in column_names]))

            copy_sql = f'COPY {relation} {formatted_columns} FROM STDIN CSV'
            if header:
                copy_sql += " HEADER"
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
    primary_key_columns = _get_primary_key_columns(table)

    if len(primary_key_columns) != 1:
        raise NotUniquePrimaryKey("This table does not have a unique primary key.")

    with engine.begin() as connection:
        first_primary_key_column = _get_primary_key_column(table, 0)
        connection.execute(
            table.update().where(first_primary_key_column == id_value).values(record_data)
        )
    return get_record(table, engine, id_value)


def delete_record(table, engine, id_value):
    primary_key_columns = _get_primary_key_columns(table)

    if len(primary_key_columns) != 1:
        raise NotUniquePrimaryKey("This table does not have a unique primary key.")

    first_primary_key_column = _get_primary_key_column(table, 0)
    query = delete(table).where(first_primary_key_column == id_value)
    with engine.begin() as conn:
        return conn.execute(query)
