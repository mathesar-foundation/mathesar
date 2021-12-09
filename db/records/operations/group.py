from enum import Enum
import json
import logging
from sqlalchemy import select, func, and_, case, literal

from db.records import exceptions as rec_exc
from db.records.utils import create_col_objects

logger = logging.getLogger(__name__)

MATHESAR_GROUP_METADATA = '__mathesar_group_metadata'


class GroupMode(Enum):
    DISTINCT = 'distinct'
    PERCENTILE = 'percentile'


class GroupMetadataField(Enum):
    COUNT = 'count'
    GROUP_ID = 'group_id'
    FIRST_VALUE = 'first_value'
    LAST_VALUE = 'last_value'


class GroupBy:
    def __init__(
            self, columns, group_mode=GroupMode.DISTINCT.value, num_groups=12
    ):
        self._columns = tuple(columns) if type(columns) != str else tuple([columns])
        self._group_mode = group_mode
        self._num_groups = num_groups

    @property
    def columns(self):
        return self._columns

    @property
    def group_mode(self):
        return self._group_mode

    @property
    def num_groups(self):
        return self._num_groups

    def validate(self):
        if self.group_mode not in {mode.value for mode in GroupMode}:
            raise rec_exc.InvalidGroupType(
                f'Group_mode "{self.group_mode}" is invalid.'
            )
        if (
                self.group_mode == GroupMode.PERCENTILE.value
                and not type(self.num_groups) == int
        ):
            raise rec_exc.BadGroupFormat(
                'percentile group_mode requires integer num_groups'
            )

        for col in self.columns:
            if type(col) != str:
                raise rec_exc.BadGroupFormat(
                    f"Group column {col} must be a string."
                )

    def get_validated_group_by_columns(self, table):
        self.validate()
        for col in self.columns:
            col_name = col if isinstance(col, str) else col.name
            if col_name not in table.columns:
                raise rec_exc.GroupFieldNotFound(
                    f"Group col {col} not found in {table}."
                )
        return create_col_objects(table, self.columns)


class GroupingWindowDefinition:
    def __init__(self, partition_by, order_by):
        self._partition_by = partition_by
        self._order_by = tuple(order_by)
        self._range = (None, None)

    @property
    def partition_by(self):
        return self._partition_by

    @property
    def order_by(self):
        return self._order_by

    @property
    def range_(self):
        return self._range


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
        raise rec_exc.BadGroupFormat("Unknown error")
    return query


def _get_distinct_group_select(table, grouping_columns):
    window_def = GroupingWindowDefinition(
        order_by=grouping_columns, partition_by=grouping_columns
    )

    group_id_expr = func.dense_rank().over(
        order_by=window_def.order_by, range_=window_def.range_
    )
    return select(
        table,
        _get_group_metadata_definition(window_def, grouping_columns, group_id_expr)
    )


def _get_percentile_range_group_select(table, columns, num_groups):
    column_names = [col.name for col in columns]
    CUME_DIST = 'cume_dist'
    RANGE_ID = 'range_id'
    cume_dist_cte = select(
        table,
        func.cume_dist().over(order_by=columns).label(CUME_DIST)
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
    window_def = GroupingWindowDefinition(
        order_by=ranges_agg_cols, partition_by=ranges_cte.columns[RANGE_ID]
    )
    group_id_expr = window_def.partition_by

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
        func.count(1).over(partition_by=window_def.partition_by),
        literal(GroupMetadataField.FIRST_VALUE.value),
        func.first_value(inner_grouping_object).over(
            partition_by=window_def.partition_by,
            order_by=window_def.order_by,
            range_=window_def.range_,
        ),
        literal(GroupMetadataField.LAST_VALUE.value),
        func.last_value(inner_grouping_object).over(
            partition_by=window_def.partition_by,
            order_by=window_def.order_by,
            range_=window_def.range_,
        ),
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
        data = {
            k: v for k, v in record[data_key].items()
            if k != MATHESAR_GROUP_METADATA
        }
        group_metadata = record[data_key].get(MATHESAR_GROUP_METADATA, {})
        metadata = (
            record.get(metadata_key, {})
            | {
                GroupMetadataField.GROUP_ID.value: group_metadata.get(
                    GroupMetadataField.GROUP_ID.value
                )
            }
        )
        return (
            {data_key: data, metadata_key: metadata},
            group_metadata if group_metadata else None
        )

    record_tup, group_tup = zip(
        *(_get_record_pieces(record) for record in record_dictionaries)
    )

    reduced_groups = sorted(
        [json.loads(blob) for blob in set([json.dumps(group) for group in group_tup])],
        key=lambda x: x[GroupMetadataField.GROUP_ID.value] if x else None
    )

    return list(record_tup), reduced_groups if reduced_groups != [None] else None
