from collections import namedtuple
from sqlalchemy import select, Column, func, and_, case, text, literal
from sqlalchemy.dialects.postgresql import array

from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType
from db.records.operations.select import get_query, apply_filters
from db.records.utils import create_col_objects
from db.utils import execute_query


COUNT = 'count'
CUME_DIST = 'cume_dist'
MIN_ROW = 'min_row'
MAX_ROW = 'max_row'
ORDER_BY = 'order_by'
PARTITION_BY = 'partition_by'
RANGE_ID = 'range_id'
RANGE_ = 'range_'


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
        column_list,
        engine,
        table=None,
        limit=None,
        offset=None,
        num_groups=12,
        group_type='percentile',
        output_table=None,
):
    supported_group_types = {
        'percentile': lambda column_list: select(
            func.row_to_json(
                func.unnest(
                    func.percentile_disc(
                        [n / num_groups for n in range(num_groups + 1)]
                    )
                    .within_group(func.row(*column_list))
                )
            )
        ),
    }
    try:
        select_func = supported_group_types[group_type]
    except KeyError:
        raise InvalidGroupType

    if table is not None:
        column_list = create_col_objects(table, column_list)

    query = select_func(column_list).limit(limit).offset(offset)
    result = execute_query(engine, query)
    return [tuple(row[0].values()) for row in result]


def _get_percentile_range_groups(column_list, num_groups, engine):
    column_names = [col.name for col in column_list]

    cume_dist_cte = (
        select(
            *column_list,
            func.cume_dist().over(order_by=column_list).label(CUME_DIST)
        )
        .cte()
    )
    ranges = _get_fractional_cases(cume_dist_cte.columns[CUME_DIST], num_groups)
    ranges_cte = select(cume_dist_cte, case(*ranges).label(RANGE_ID)).cte()
    ranges_agg_cols = [
        col for col in ranges_cte.columns if col.name in column_names
    ]
    window_def = {
        PARTITION_BY: ranges_cte.columns[RANGE_ID],
        ORDER_BY: ranges_agg_cols,
        RANGE_: (None, None)
    }
    final_sel = (
        select(
            ranges_cte.columns[RANGE_ID],
            _get_row_jsonb_window_expr(func.first_value, ranges_agg_cols, window_def).label(MIN_ROW),
            _get_row_jsonb_window_expr(func.last_value, ranges_agg_cols, window_def).label(MAX_ROW),
            func.count(1).over(partition_by=window_def[PARTITION_BY]).label(COUNT)
        ).distinct()
    )
    with engine.begin() as conn:
        result = [
            {
                RANGE_ID: row[RANGE_ID],
                MIN_ROW: {column_names[i]: row[MIN_ROW][f'f{i+1}'] for i in range(len(column_list))},
                MAX_ROW: {column_names[i]: row[MAX_ROW][f'f{i+1}'] for i in range(len(column_list))},
                COUNT: row[COUNT]
            }
            for row in conn.execute(final_sel).fetchall()
        ]

    return result


def _get_row_jsonb_window_expr(window_function, row_columns, window_def):
    return func.to_jsonb(window_function(func.row(*row_columns)).over(**window_def))


def _get_fractional_cases(column, num_groups):
    """
    The column should be numeric values between 0 and 1.  This writes a
    list of cases (expressed as tuples for the SQLAlchemy case function)
    splitting such a column into num_groups different parts.  Does not
    include zero.
    """
    return [
        (and_(column > i / num_groups, column <= (i + 1) / num_groups), i)
        for i in range(num_groups)
    ]


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


def get_group_counts(
        table,
        engine,
        group_by,
        limit=None,
        offset=None,
        order_by=[],
        filters=[]
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
    table_columns = _get_validated_group_by_columns(table, group_by)
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


def get_group_augmented_records_query(
        table,
        engine,
        group_by,
        limit=None,
        offset=None,
        order_by=[],
        filters=[]
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
    grouping_columns = _get_validated_group_by_columns(table, group_by)
    window_def = {
        PARTITION_BY: grouping_columns,
        ORDER_BY: grouping_columns,
        RANGE_: (None, None),
    }

    col_key_value_tuples = ((literal(str(col.name)), col) for col in grouping_columns)
    col_key_value_list = [
        col_part for col_tup in col_key_value_tuples for col_part in col_tup
    ]
    inner_grouping_object = func.json_build_object(*col_key_value_list)

    sel = select(
        table, func.json_build_object(
            literal('count'),
            func.count(1).over(**window_def),
            literal('first_value'),
            func.first_value(inner_grouping_object).over(**window_def),
            literal('last_value'),
            func.last_value(inner_grouping_object).over(**window_def),
            literal('group_id'),
            func.dense_rank().over(
                order_by=window_def[ORDER_BY],
                range_=window_def[RANGE_],
            )
        )
    )
    return sel


def _get_validated_group_by_columns(table, group_by):
    if type(group_by) not in (tuple, list):
        raise BadGroupFormat(f"Group spec {group_by} must be list or tuple.")
    for field in group_by:
        if type(field) not in (str, Column):
            raise BadGroupFormat(f"Group field {field} must be a string or Column.")
        field_name = field if isinstance(field, str) else field.name
        if field_name not in table.c:
            raise GroupFieldNotFound(f"Group field {field} not found in {table}.")
    return create_col_objects(table, group_by)
