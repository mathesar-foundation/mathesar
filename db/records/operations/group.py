from enum import Enum
import json
import logging
from sqlalchemy import select, func, and_, case, literal, cast, TEXT, extract

from db.functions.operations.deserialize import get_db_function_subclass_by_id
from db.records import exceptions as records_exceptions
from db.records.operations import calculation
from db.records.utils import create_col_objects

logger = logging.getLogger(__name__)

MATHESAR_GROUP_METADATA = '__mathesar_group_metadata'


class GroupMode(Enum):
    DISTINCT = 'distinct'
    ENDPOINTS = 'endpoints'  # intended for internal use at the moment
    EXTRACT = 'extract'
    MAGNITUDE = 'magnitude'
    COUNT_BY = 'count_by'
    PERCENTILE = 'percentile'
    PREFIX = 'prefix'


class GroupMetadataField(Enum):
    COUNT = 'count'
    GROUP_ID = 'group_id'
    FIRST_VALUE = 'first_value'
    LAST_VALUE = 'last_value'
    LEQ_VALUE = 'less_than_eq_value'
    GEQ_VALUE = 'greater_than_eq_value'
    LT_VALUE = 'less_than_value'
    GT_VALUE = 'greater_than_value'


class GroupBy:
    def __init__(
            self,
            columns,
            mode=GroupMode.DISTINCT.value,
            preproc=None,
            num_groups=None,
            bound_tuples=None,
            count_by=None,
            global_min=None,
            global_max=None,
            prefix_length=None,
            extract_field=None,
    ):
        self._columns = tuple(columns) if type(columns) != str else tuple([columns])
        self._mode = mode
        if type(preproc) == str:
            self._preproc = tuple([preproc])
        elif preproc is not None:
            self._preproc = tuple(preproc)
        else:
            self._preproc = None
        self._num_groups = num_groups
        self._bound_tuples = bound_tuples
        self._count_by = count_by
        self._global_min = global_min
        self._global_max = global_max
        self._prefix_length = prefix_length
        self._extract_field = extract_field
        self._ranged = bool(mode != GroupMode.DISTINCT.value)
        self.validate()

    @property
    def columns(self):
        return self._columns

    @property
    def mode(self):
        return self._mode

    @property
    def preproc(self):
        return self._preproc

    @property
    def num_groups(self):
        return self._num_groups

    @property
    def bound_tuples(self):
        if self._bound_tuples is not None:
            return self._bound_tuples
        elif self._mode == GroupMode.COUNT_BY.value:
            return [bt for bt in self._bound_tuple_generator()]

    @property
    def count_by(self):
        return self._count_by

    @property
    def global_min(self):
        return self._count_by

    @property
    def global_max(self):
        return self._count_by

    @property
    def prefix_length(self):
        return self._prefix_length

    @property
    def extract_field(self):
        return self._extract_field

    @property
    def ranged(self):
        return self._ranged

    def _bound_tuple_generator(self):
        val = self._global_min
        while val <= self._global_max:
            yield (val,)
            val += self._count_by

    def validate(self):
        group_modes = {group_mode.value for group_mode in GroupMode}
        if self.mode not in group_modes:
            raise records_exceptions.InvalidGroupType(
                f'mode "{self.mode}" is invalid. valid modes are: '
                + ', '.join([f"'{gm}'" for gm in group_modes])
            )
        elif self.preproc is not None and len(self.preproc) != len(self.columns):
            raise records_exceptions.BadGroupFormat(
                'preproc must be same length as columns if given'
            )

        elif (
                self.mode == GroupMode.PERCENTILE.value
                and not type(self.num_groups) == int
        ):
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.PERCENTILE.value} mode requires integer num_groups'
            )
        elif self.mode == GroupMode.MAGNITUDE.value and not len(self.columns) == 1:
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.MAGNITUDE.value} mode only works on single columns'
            )
        elif self.mode == GroupMode.ENDPOINTS.value and not self.bound_tuples:
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.ENDPOINTS.value} mode requires bound_tuples'
            )
        elif (
                self.mode == GroupMode.PREFIX.value
                and (
                    not len(self.columns) == 1
                    or self.prefix_length is None
                )
        ):
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.PREFIX.value} mode requires prefix_length,'
                ' and only works for single columns.'
            )
        elif (
                self.mode == GroupMode.COUNT_BY.value
                and (
                    self._count_by is None
                    or not len(self.columns) == 1
                    or self._global_min is None
                    or self._global_max is None
                )
        ):
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.COUNT_BY.value} mode requires'
                ' count_by, global_min, and global_max.'
                ' further, it works only for single columns.'
            )
        elif (
                self.mode == GroupMode.EXTRACT.value
                and (not len(self.columns) == 1 or self._extract_field is None)
        ):
            raise records_exceptions.BadGroupFormat(
                f'{GroupMode.EXTRACT.value} requires extract_field,'
                ' and only works for single columns.'
            )

        for col in self.columns:
            if type(col) != str:
                raise records_exceptions.BadGroupFormat(
                    f"Group column {col} must be a string."
                )

    def get_validated_group_by_columns(self, table):
        for col in self.columns:
            col_name = col if isinstance(col, str) else col.name
            if col_name not in table.columns:
                raise records_exceptions.GroupFieldNotFound(
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


def get_group_augmented_records_relation(table, group_by):
    """
    Returns counts by specified groupings

    Args:
        table:      SQLAlchemy table object
        group_by:   GroupBy object giving args for grouping
    """
    grouping_columns = group_by.get_validated_group_by_columns(table)

    if group_by.mode == GroupMode.PERCENTILE.value:
        pg_query = _get_percentile_range_group_select(
            table, grouping_columns, group_by.num_groups
        )
    elif (
            group_by.mode == GroupMode.ENDPOINTS.value
            or group_by.mode == GroupMode.COUNT_BY.value
    ):
        pg_query = _get_custom_endpoints_range_group_select(
            table, grouping_columns, group_by.bound_tuples
        )
    elif group_by.mode == GroupMode.MAGNITUDE.value:
        pg_query = _get_tens_powers_range_group_select(table, grouping_columns)
    elif group_by.mode == GroupMode.DISTINCT.value:
        pg_query = _get_distinct_group_select(table, grouping_columns, group_by.preproc)
    elif group_by.mode == GroupMode.PREFIX.value:
        pg_query = _get_prefix_group_select(table, grouping_columns, group_by.prefix_length)
    elif group_by.mode == GroupMode.EXTRACT.value:
        pg_query = _get_extract_group_select(table, grouping_columns, group_by.extract_field)
    else:
        raise records_exceptions.BadGroupFormat("Unknown error")
    return pg_query.cte()


def _get_distinct_group_select(table, grouping_columns, preproc):
    window_def = GroupingWindowDefinition(
        order_by=grouping_columns, partition_by=grouping_columns
    )

    if preproc is not None:
        processed_columns = [
            get_db_function_subclass_by_id(proc).to_sa_expression(col)
            for proc, col in zip(preproc, grouping_columns)
            if proc is not None
        ]
    else:
        processed_columns = grouping_columns

    group_id_expr = func.dense_rank().over(
        order_by=processed_columns, range_=window_def.range_
    )
    return select(
        table,
        _get_group_metadata_definition(window_def, grouping_columns, group_id_expr)
    )


def _get_extract_group_select(table, grouping_columns, extract_field):
    window_def = GroupingWindowDefinition(
        order_by=grouping_columns, partition_by=grouping_columns
    )
    processed_columns = [extract(extract_field, grouping_columns[0])]
    group_id_expr = func.dense_rank().over(
        order_by=processed_columns, range_=window_def.range_
    )

    return select(
        table,
        _get_group_metadata_definition(window_def, grouping_columns, group_id_expr)
    )


def _get_prefix_group_select(table, grouping_columns, prefix_length):
    grouping_column = grouping_columns[0]
    prefix_expr = func.left(cast(grouping_column, TEXT), prefix_length)
    window_def = GroupingWindowDefinition(
        order_by=grouping_columns, partition_by=prefix_expr
    )
    group_id_expr = func.dense_rank().over(
        order_by=window_def.partition_by, range_=window_def.range_
    )
    return select(
        table,
        _get_group_metadata_definition(window_def, grouping_columns, group_id_expr)
    )


def _get_tens_powers_range_group_select(table, grouping_columns):
    EXTREMA_DIFF = 'extrema_difference'
    POWER = 'power'
    RAW_ID = 'raw_id'

    assert len(grouping_columns) == 1
    grouping_column = grouping_columns[0]
    diff_cte = calculation.get_extrema_diff_select(
        table, grouping_column, EXTREMA_DIFF
    ).cte('diff_cte')
    power_cte = calculation.get_offset_order_of_magnitude_select(
        diff_cte, diff_cte.columns[EXTREMA_DIFF], POWER
    ).cte('power_cte')
    raw_id_cte = calculation.divide_by_power_of_ten_select(
        power_cte,
        power_cte.columns[grouping_column.name],
        power_cte.columns[POWER],
        RAW_ID
    ).cte('raw_id_cte')
    cte_main_col_list = [
        col for col in raw_id_cte.columns if col.name == grouping_column.name
    ]
    window_def = GroupingWindowDefinition(
        order_by=cte_main_col_list, partition_by=raw_id_cte.columns[RAW_ID]
    )

    group_id_expr = func.dense_rank().over(
        order_by=window_def.partition_by, range_=window_def.range_
    )

    def _get_pretty_bound_expr(id_offset):
        raw_id_col = raw_id_cte.columns[RAW_ID]
        power_col = raw_id_cte.columns[POWER]
        power_expr = func.pow(literal(10.0), power_col)
        return case(
            (power_col >= 0, func.trunc((raw_id_col + id_offset) * power_expr)),
            else_=func.trunc(
                (raw_id_col + id_offset) * power_expr,
                ((-1) * power_col)
            )
        )

    geq_expr = func.json_build_object(
        grouping_column.name, _get_pretty_bound_expr(0)
    )
    lt_expr = func.json_build_object(
        grouping_column.name, _get_pretty_bound_expr(1)
    )
    return select(
        *[col for col in raw_id_cte.columns if col.name in table.columns],
        _get_group_metadata_definition(
            window_def,
            cte_main_col_list,
            group_id_expr,
            geq_expr=geq_expr,
            lt_expr=lt_expr,
        )
    )


def _get_custom_endpoints_range_group_select(table, columns, bound_tuples_list):
    column_names = [col.name for col in columns]
    RANGE_ID = 'range_id'
    GEQ_BOUND = 'geq_bound'
    LT_BOUND = 'lt_bound'

    def _get_inner_json_object(bound_tuple):
        key_value_tuples = (
            (literal(str(col)), literal(val))
            for col, val in zip(column_names, bound_tuple)
        )
        key_value_list = [
            part for tup in key_value_tuples for part in tup
        ]
        return func.json_build_object(*key_value_list)

    def _build_range_cases(result_expr):
        return [
            (
                and_(
                    func.ROW(*columns) >= func.ROW(*bound_tuples_list[i]),
                    func.ROW(*columns) < func.ROW(*bound_tuples_list[i + 1])
                ),
                result_expr(i)
            )
            for i in range(len(bound_tuples_list) - 1)
        ]
    ranges_cte = select(
        *columns,
        case(*_build_range_cases(lambda x: x + 1), else_=None).label(RANGE_ID),
        case(
            *_build_range_cases(
                lambda x: _get_inner_json_object(bound_tuples_list[x])
            ),
            else_=None
        ).label(GEQ_BOUND),
        case(
            *_build_range_cases(
                lambda x: _get_inner_json_object(bound_tuples_list[x + 1])
            ),
            else_=None
        ).label(LT_BOUND),
    ).cte()

    ranges_aggregation_cols = [
        col for col in ranges_cte.columns if col.name in column_names
    ]
    window_def = GroupingWindowDefinition(
        order_by=ranges_aggregation_cols,
        partition_by=ranges_cte.columns[RANGE_ID]
    )
    group_id_expr = window_def.partition_by
    geq_expr = ranges_cte.columns[GEQ_BOUND]
    lt_expr = ranges_cte.columns[LT_BOUND]
    return select(
        *[col for col in ranges_cte.columns if col.name in table.columns],
        _get_group_metadata_definition(
            window_def,
            ranges_aggregation_cols,
            group_id_expr,
            geq_expr=geq_expr,
            lt_expr=lt_expr,
        )
    ).where(ranges_cte.columns[RANGE_ID] != None)  # noqa


def _get_percentile_range_group_select(table, columns, num_groups):
    column_names = [col.name for col in columns]
    # cume_dist is a PostgreSQL function that calculates the cumulative
    # distribution.
    # See https://www.postgresql.org/docs/13/functions-window.html
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
    ranges_aggregation_cols = [
        col for col in ranges_cte.columns if col.name in column_names
    ]
    window_def = GroupingWindowDefinition(
        order_by=ranges_aggregation_cols,
        partition_by=ranges_cte.columns[RANGE_ID]
    )
    group_id_expr = window_def.partition_by

    return select(
        *[col for col in ranges_cte.columns if col.name in table.columns],
        _get_group_metadata_definition(
            window_def, ranges_aggregation_cols, group_id_expr
        )
    )


def _get_group_metadata_definition(
        window_def,
        grouping_columns,
        group_id_expr,
        leq_expr=None,
        geq_expr=None,
        lt_expr=None,
        gt_expr=None,
):
    col_key_value_tuples = (
        (literal(str(col.name)), col) for col in grouping_columns
    )
    col_key_value_list = [
        col_part for col_tuple in col_key_value_tuples for col_part in col_tuple
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
        # These values are 'pretty' bounds. What 'pretty' means is based
        # on the caller, and so these expressions need to be defined by
        # that caller.
        literal(GroupMetadataField.LEQ_VALUE.value),
        leq_expr,
        literal(GroupMetadataField.GEQ_VALUE.value),
        geq_expr,
        literal(GroupMetadataField.LT_VALUE.value),
        lt_expr,
        literal(GroupMetadataField.GT_VALUE.value),
        gt_expr,
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
        if group_metadata:
            metadata = (
                record.get(metadata_key, {})
                | {
                    GroupMetadataField.GROUP_ID.value: group_metadata.get(
                        GroupMetadataField.GROUP_ID.value
                    )
                }
            )
        else:
            metadata = record.get(metadata_key)
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
