from sqlalchemy import select, Column, func

from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType
from db.records.operations.select import get_query, apply_filters
from db.records.utils import create_col_objects, get_column_object
from db.utils import execute_query


def append_distinct_tuples_to_filter(distinct_tuples):
    filters = []
    for col, value in distinct_tuples:
        filters.append({
            "field": col,
            "op": "==",
            "value": value,
        })
    return filters


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
        column_objects = create_col_objects(table, column_list)
    else:
        column_objects = column_list
    try:
        assert all([type(col) == Column for col in column_objects])
    except AssertionError as e:
        raise e

    query = (
        select(*column_objects)
        .distinct()
        .limit(limit)
        .offset(offset)
    )
    result = execute_query(engine, query)
    if output_table is not None:
        column_objects = [output_table.columns[col.name] for col in column_objects]
    return [tuple(zip(column_objects, row)) for row in result]


def get_grouping_range_boundaries(
        column,
        engine,
        table=None,
        limit=None,
        offset=None,
        num_groups=12,
        group_type='percentile',
        output_table=None,
):
    supported_group_types = {
        'percentile': lambda column: select(
            func.unnest(
                func.percentile_disc(
                    [n / num_groups for n in range(num_groups + 1)]
                )
                .within_group(column)
            )
        )
    }
    try:
        select_func = supported_group_types[group_type]
    except KeyError:
        raise InvalidGroupType

    if table is not None:
        column = get_column_object(table, column)

    query = select_func(column).limit(limit).offset(offset)
    result = execute_query(engine, query)
    return tuple((result[i][0], result[i + 1][0]) for i in range(len(result) - 1))


def _get_filtered_group_by_count_query(
        table, engine, group_by, limit, offset, order_by, filters, count_query
):
    # Get the list of groups that we should count.
    # We're considering limit and offset here so that we only count relevant groups
    relevant_subtable_query = get_query(table, limit, offset, order_by, filters)
    relevant_subtable_cte = relevant_subtable_query.cte()
    cte_columns = create_col_objects(relevant_subtable_cte, group_by)
    distinct_tuples = get_distinct_tuple_values(cte_columns, engine, output_table=table)
    if distinct_tuples:
        limited_filters = [
            {
                "or": [
                    append_distinct_tuples_to_filter(distinct_tuple_spec)
                    for distinct_tuple_spec in distinct_tuples
                ]
            }
        ]
        filtered_count_query = apply_filters(count_query, limited_filters)
    else:
        filtered_count_query = None
    return filtered_count_query


def get_group_counts(table, engine, group_by, limit=None, offset=None, order_by=[], filters=[]):
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

    table_columns = create_col_objects(table, group_by)
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
        records = execute_query(engine, filtered_count_query)
        # Last field is the count, preceding fields are the group by fields
        counts = {(*record[:-1],): record[-1] for record in records}
    else:
        counts = {}
    return counts
