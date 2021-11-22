from enum import Enum
import json
import logging
from sqlalchemy import select, Column, func, and_, case, literal

from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType
from db.records.utils import create_col_objects
from db.utils import execute_query

logger = logging.getLogger(__name__)

COUNT = 'count'
CUME_DIST = 'cume_dist'
FIRST_VALUE = 'first_value'
GROUP_ID = 'group_id'
LAST_VALUE = 'last_value'
MIN_ROW = 'min_row'
MAX_ROW = 'max_row'
ORDER_BY = 'order_by'
PARTITION_BY = 'partition_by'
RANGE_ID = 'range_id'
RANGE_ = 'range_'
MATHESAR_GROUP_METADATA = '__mathesar_group_metadata'


class GroupingMode(Enum):
    DISTINCT = 'distinct'
    PERCENTILE = 'percentile'


def get_group_augmented_records_query(
        table, column_list, group_mode=GroupingMode.DISTINCT.value, num_groups=12,
):
    """
    Returns counts by specified groupings

    Args:
        table:      SQLAlchemy table object
        group_by:   list or tuple of column names or column objects to group by
        group_mode: string defining how to perform grouping
    """
    grouping_columns = _get_validated_group_by_columns(table, column_list)

    if group_mode == GroupingMode.PERCENTILE.value:
        return _get_percentile_range_group_select(table, grouping_columns, num_groups)
    elif group_mode == GroupingMode.DISTINCT.value:
        return _get_distinct_group_select(table, grouping_columns)
    else:
        logger.warn(f'group_mode "{group_mode}" not known.  falling back to default')
        return get_group_augmented_records_query(table, column_list)


def _get_percentile_range_group_select(table, column_list, num_groups):
    column_names = [col.name for col in column_list]
    cume_dist_cte = select(
        table,
        func.cume_dist().over(order_by=column_list).label(CUME_DIST)
    ).cte()
    ranges = _get_fractional_cases(cume_dist_cte.columns[CUME_DIST], num_groups)
    ranges_cte = select(
        *[col for col in cume_dist_cte.columns if col.name != CUME_DIST],
        case(*ranges).label(RANGE_ID)
    ).cte()
    ranges_agg_cols = [
        col for col in ranges_cte.columns if col.name in column_names
    ]
    window_def = {
        PARTITION_BY: ranges_cte.columns[RANGE_ID],
        ORDER_BY: ranges_agg_cols,
        RANGE_: (None, None)
    }

    col_key_value_tuples = ((literal(str(col.name)), col) for col in ranges_agg_cols)
    col_key_value_list = [
        col_part for col_tup in col_key_value_tuples for col_part in col_tup
    ]
    inner_grouping_object = func.json_build_object(*col_key_value_list)


    final_sel = select(
        *[col for col in ranges_cte.columns if col.name in table.columns],
        func.json_build_object(
            literal(COUNT),
            func.count(1).over(partition_by=window_def[PARTITION_BY]),
            literal(FIRST_VALUE),
            func.first_value(inner_grouping_object).over(**window_def),
            literal(LAST_VALUE),
            func.last_value(inner_grouping_object).over(**window_def),
            literal(GROUP_ID),
            window_def[PARTITION_BY]
        ).label(MATHESAR_GROUP_METADATA)
    )

    with engine.begin() as conn:
        result = conn.execute(final_sel).fetchall()

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
        (and_(column > i / num_groups, column <= (i + 1) / num_groups), i + 1)
        for i in range(num_groups)
    ]


def _get_distinct_group_select(table, grouping_columns):

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
            literal(COUNT),
            func.count(1).over(**window_def),
            literal(FIRST_VALUE),
            func.first_value(inner_grouping_object).over(**window_def),
            literal(LAST_VALUE),
            func.last_value(inner_grouping_object).over(**window_def),
            literal(GROUP_ID),
            func.dense_rank().over(
                order_by=window_def[ORDER_BY],
                range_=window_def[RANGE_],
            )
        ).label(MATHESAR_GROUP_METADATA)
    )
    return sel


def extract_group_metadata(
        record_dictionaries, data_key='data', metadata_key='metadata',
):
    """
    This function takes an iterable of record dictionaries with record data and
    record metadata, and moves the group metadata from the data section to the
    metadata section.
    """
    def _get_record_pieces(record):
        data = {k: v for k, v in record[data_key].items() if k != MATHESAR_GROUP_METADATA}
        group_metadata = record[data_key].get(MATHESAR_GROUP_METADATA, {})
        metadata = record[metadata_key] | {GROUP_ID: group_metadata.get(GROUP_ID)}
        return {data_key: data, metadata_key: metadata}, group_metadata if group_metadata else None

    record_tup, group_tup = zip(
        *(_get_record_pieces(record) for record in record_dictionaries)
    )

    reduced_groups = sorted(
        [json.loads(blob) for blob in set([json.dumps(group) for group in group_tup])],
        key=lambda x: x['group_id']
    )

    return list(record_tup), reduced_groups


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
