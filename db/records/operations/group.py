from dataclasses import dataclass
from enum import Enum
import json
import logging
from sqlalchemy import select, Column, func, and_, case, literal

from db.records.exceptions import BadGroupFormat, GroupFieldNotFound, InvalidGroupType
from db.records.utils import create_col_objects
from db.utils import execute_query

logger = logging.getLogger(__name__)

MIN_ROW = 'min_row'
MAX_ROW = 'max_row'
ORDER_BY = 'order_by'
PARTITION_BY = 'partition_by'
RANGE_ID = 'range_id'
RANGE_ = 'range_'
MATHESAR_GROUP_METADATA = '__mathesar_group_metadata'


class GroupMode(Enum):
    DISTINCT = 'distinct'
    PERCENTILE = 'percentile'


class GroupMetadataField(Enum):
    COUNT = 'count'
    GROUP_ID = 'group_id'
    FIRST_VALUE = 'first_value'
    LAST_VALUE = 'last_value'


@dataclass(frozen=True, eq=True)
class GroupBy:
    column_list: 'a list of columns or column names'
    group_mode: 'a string from in the GroupMode Enum' = GroupMode.DISTINCT.value
    num_groups: 'an int giving how many groups to produce for certain modes' = 12

    def get_validated_group_by_columns(self, table):
        if type(self.column_list) not in (tuple, list):
            raise BadGroupFormat(f"column_list must be list or tuple.")
        for field in self.column_list:
            if type(field) not in (str, Column):
                raise BadGroupFormat(f"Group field {field} must be a string or Column.")
            field_name = field if isinstance(field, str) else field.name
            if field_name not in table.columns:
                raise GroupFieldNotFound(f"Group field {field} not found in {table}.")
        return create_col_objects(table, self.column_list)


def get_group_augmented_records_query(table, group_by):
    """
    Returns counts by specified groupings

    Args:
        table:      SQLAlchemy table object
        group_by:   GroupBy object giving args for grouping
    """
    grouping_columns = group_by.get_validated_group_by_columns(table)

    if group_by.group_mode == GroupMode.PERCENTILE.value:
        query = _get_percentile_range_group_select(
            table, grouping_columns, group_by.num_groups
        )
    elif group_by.group_mode == GroupMode.DISTINCT.value:
        query = _get_distinct_group_select(table, grouping_columns)
    else:
        logger.warn(
            f'group_mode "{group_by.group_mode}" not known. Falling back to default.'
        )
        query = get_group_augmented_records_query(
            table, GroupBy(column_list=group_by.column_list)
        )
    return query


def _get_distinct_group_select(table, grouping_columns):
    window_def = {
        PARTITION_BY: grouping_columns,
        ORDER_BY: grouping_columns,
        RANGE_: (None, None),
    }
    group_id_expr = func.dense_rank().over(
        order_by=window_def[ORDER_BY], range_=window_def[RANGE_]
    )
    return select(
        table,
        _get_group_metadata_definition(window_def, grouping_columns, group_id_expr)
    )


def _get_percentile_range_group_select(table, column_list, num_groups):
    column_names = [col.name for col in column_list]
    CUME_DIST = 'cume_dist'
    cume_dist_cte = select(
        table,
        func.cume_dist().over(order_by=column_list).label(CUME_DIST)
    ).cte()
    ranges = [
        (
            and_(
                cume_dist_cte.columns[CUME_DIST] > i / num_groups,
                cume_dist_cte.columns[CUME_DIST] <= (i + 1) / num_groups
            ),
            i + 1
        )
        for i in range(num_groups)
    ]

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
    group_id_expr = window_def[PARTITION_BY]

    return select(
        *[col for col in ranges_cte.columns if col.name in table.columns],
        _get_group_metadata_definition(window_def, ranges_agg_cols, group_id_expr)
    )


def _get_group_metadata_definition(window_def, grouping_columns, group_id_expr):
    col_key_value_tuples = ((literal(str(col.name)), col) for col in grouping_columns)
    col_key_value_list = [
        col_part for col_tup in col_key_value_tuples for col_part in col_tup
    ]
    inner_grouping_object = func.json_build_object(*col_key_value_list)

    return func.json_build_object(
        literal(GroupMetadataField.GROUP_ID.value),
        group_id_expr,
        literal(GroupMetadataField.COUNT.value),
        func.count(1).over(partition_by=window_def[PARTITION_BY]),
        literal(GroupMetadataField.FIRST_VALUE.value),
        func.first_value(inner_grouping_object).over(**window_def),
        literal(GroupMetadataField.LAST_VALUE.value),
        func.last_value(inner_grouping_object).over(**window_def),
    ).label(MATHESAR_GROUP_METADATA)


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
        metadata = (
            record[metadata_key]
            | {
                GroupMetadataField.GROUP_ID.value: group_metadata.get(GroupMetadataField.GROUP_ID.value)
            }
        )
        return {data_key: data, metadata_key: metadata}, group_metadata if group_metadata else None



    record_tup, group_tup = zip(
        *(_get_record_pieces(record) for record in record_dictionaries)
    )

    reduced_groups = sorted(
        [json.loads(blob) for blob in set([json.dumps(group) for group in group_tup])],
        key=lambda x: x['group_id']
    )

    return list(record_tup), reduced_groups
