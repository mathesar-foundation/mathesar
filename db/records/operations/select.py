import sqlalchemy
from sqlalchemy import select, func
from sqlalchemy_filters import apply_sort
from sqlalchemy.sql.base import ColumnSet as SAColumnSet

from db.functions.operations.apply import apply_db_function_spec_as_filter
from db.columns.base import MathesarColumn
from db.records.operations import group, relevance
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.types.base import get_db_type_enum_from_id
from db.utils import execute_pg_query


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    pg_query = select(table).where(primary_key_column == id_value)
    result = execute_pg_query(engine, pg_query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records_with_default_order(
        table,
        engine,
        order_by=[],
        **kwargs,
):
    if not order_by:
        order_by = get_default_order_by(table, order_by)
    return get_records(
        table=table,
        engine=engine,
        order_by=order_by,
        **kwargs
    )


# TODO change interface to where transformations is a sequence of transform steps
# first change should be made on the viewset level, where transform steps are currently assigned
# to named parameters.
def get_records(
    table,
    engine,
    limit=None,
    offset=None,
    order_by=[],
    filter=None,
    group_by=None,
    search=[],
    duplicate_only=None,
):
    """
    Returns annotated records from a table.

    Args:
        table:           SQLAlchemy table object
        engine:          SQLAlchemy engine object
        limit:           int, gives number of rows to return
        offset:          int, gives number of rows to skip
        order_by:        list of dictionaries, where each dictionary has a 'field' and
                         'direction' field.
        search:          list of dictionaries, where each dictionary has a 'column' and
                         'literal' field.
                         See: https://github.com/centerofci/sqlalchemy-filters#sort-format
        filter:          a dictionary with one key-value pair, where the key is the filter id and
                         the value is a list of parameters; supports composition/nesting.
                         See: https://github.com/centerofci/sqlalchemy-filters#filters-format
        group_by:        group.GroupBy object
        duplicate_only:  list of column names; only rows that have duplicates across those rows
                         will be returned
    """
    relation = apply_transformations_deprecated(
        table=table,
        limit=limit,
        offset=offset,
        order_by=order_by,
        filter=filter,
        group_by=group_by,
        search=search,
        duplicate_only=duplicate_only,
        engine=engine,
    )
    return execute_pg_query(engine, relation)


def get_count(table, engine, filter=None, search=[]):
    col_name = "_count"
    columns_to_select = [func.count().label(col_name)]
    relation = apply_transformations_deprecated(
        table=table,
        engine=engine,
        limit=None,
        offset=None,
        # TODO does it make sense to order, when we're only interested in row count?
        order_by=None,
        filter=filter,
        columns_to_select=columns_to_select,
        search=search,
    )
    return execute_pg_query(engine, relation)[0][col_name]


# NOTE deprecated; this will be replaced with apply_transformations
def apply_transformations_deprecated(
    table,
    engine,
    limit=None,
    offset=None,
    order_by=None,
    filter=None,
    columns_to_select=None,
    group_by=None,
    duplicate_only=None,
    summarize=None,
    search=[],
):
    # TODO rename the actual method parameter
    relation = table

    _enforce_relation_type_expectations(relation)

    if duplicate_only:
        relation = _get_duplicate_only_cte(relation, duplicate_only)
    if group_by:
        relation = _grouping_metadata(relation, group_by)
    if order_by:
        relation = _sort(relation, order_by)
    if filter:
        relation = _filter(relation, filter)
    if search:
        relation = _search(
            relation=relation,
            engine=engine,
            search=search,
            limit=limit
        )
    if columns_to_select:
        relation = _select_subset_of_columns(
            relation,
            columns_to_select,)
    if offset:
        relation = _offset(relation, offset)
    if limit:
        relation = _limit(relation, limit)
    return relation


def _enforce_relation_type_expectations(relation):
    """
    The convention being enforced is to pass around instances of Selectables that are not
    Executables. We need to do it one way, for the sake of uniformity and compatibility.
    It's not the other way around, because if you pass around Executables, composition sometimes
    works differently.

    This method is a development tool mostly, probably shouldn't exist in actual production.
    """
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    assert not isinstance(relation, sqlalchemy.sql.expression.Executable)


def apply_transformations(relation, transformations):
    _enforce_relation_type_expectations(relation)
    for transform in transformations:
        relation = _apply_transform(relation, transform)
    return relation


def _apply_transform(relation, transform):
    transform_type = transform['type']
    if transform_type == 'filter':
        spec = transform['spec']
        relation = _filter(relation, spec)
    elif transform_type == 'order':
        spec = transform['spec']
        relation = _sort(relation, spec)
    elif transform_type == 'grouping':
        spec = transform['spec']
        group_by_spec = spec.get('group_by')
        relation = _grouping_metadata(relation, group_by_spec)
    elif transform_type == 'limit':
        spec = transform['spec']
        relation = _limit(relation, spec)
    elif transform_type == 'offset':
        spec = transform['spec']
        relation = _offset(relation, spec)
    elif transform_type == 'select':
        spec = transform['spec']
        relation = _select_subset_of_columns(
            relation,
            spec,)
    else:
        # TODO handle other transform types
        raise Exception("unexpected or tbd")
    _enforce_relation_type_expectations(relation)
    return relation


def _limit(relation, limit):
    executable = _to_executable(relation)
    executable = executable.limit(limit)
    return _to_non_executable(executable)


def _offset(relation, offset):
    executable = _to_executable(relation)
    executable = executable.offset(offset)
    return _to_non_executable(executable)


def _search(relation, engine, search, limit):
    search_params = {search_obj['column']: search_obj['literal'] for search_obj in search}
    relation = relevance.get_rank_and_filter_rows_query(relation, search_params, engine, limit)
    return relation


def _grouping_metadata(relation, group_by):
    # TODO maybe keep this as json, and convert to GroupBy at last moment?
    # other transform specs are json at this point in the pipeline
    if isinstance(group_by, group.GroupBy):
        relation = group.get_group_augmented_records_relation(relation, group_by)

    return relation


def _select_subset_of_columns(relation, columns_to_select):
    if columns_to_select:
        executable = _to_executable(relation)
        processed_columns_to_select = tuple(
            _make_sure_column_expression(column)
            for column
            in columns_to_select
        )
        executable = select(*processed_columns_to_select).select_from(executable)
        return _to_non_executable(executable)
    else:
        return relation


def _make_sure_column_expression(input):
    if isinstance(input, str):
        return sqlalchemy.column(input)
    else:
        return input


def get_default_order_by(table, order_by):
    # Set default ordering if none was requested
    relation_has_pk = hasattr(table, 'primary_key')
    if relation_has_pk:
        pk = table.primary_key
        pk_cols = None
        if hasattr(pk, 'columns'):
            pk_cols = pk.columns
        elif isinstance(pk, SAColumnSet):
            pk_cols = pk
        # If there are primary keys, order by all primary keys
        if pk_cols is not None and len(pk_cols) > 0:
            order_by = [
                {'field': str(col.name), 'direction': 'asc'}
                for col
                in pk_cols
            ]
    if not order_by:
        # If there aren't primary keys, order by all columns
        order_by = [
            {'field': col, 'direction': 'asc'}
            for col
            in table.columns
        ]
    return order_by


def _get_duplicate_only_cte(relation, duplicate_columns):
    _enforce_relation_type_expectations(relation)
    DUPLICATE_LABEL = "_is_dupe"
    duplicate_flag_cte = (
        select(
            *relation.c,
            (
                func
                .count(1)
                .over(partition_by=duplicate_columns) > 1
            ).label(DUPLICATE_LABEL),
        ).select_from(relation)
    ).cte()
    executable = (
        select(duplicate_flag_cte)
        .where(duplicate_flag_cte.c[DUPLICATE_LABEL])
    )
    return _to_non_executable(executable)


def _sort(relation, order_by):
    _enforce_relation_type_expectations(relation)
    executable = _to_executable(relation)
    if order_by is not None:
        executable = apply_sort(executable, order_by)
    return _to_non_executable(executable)


def _filter(relation, filter):
    _enforce_relation_type_expectations(relation)
    executable = _to_executable(relation)
    if filter is not None:
        executable = apply_db_function_spec_as_filter(executable, filter)
    return _to_non_executable(executable)


def get_column_cast_records(engine, table, column_definitions, num_records=20):
    assert len(column_definitions) == len(table.columns)
    cast_expression_list = [
        _get_column_cast_expression_or_column(column, col_def, engine)
        for column, col_def in zip(table.columns, column_definitions)
    ]
    sel = select(cast_expression_list).limit(num_records)
    with engine.begin() as conn:
        result = conn.execute(sel)
    return result.fetchall()


def _get_column_cast_expression_or_column(column, col_def, engine):
    """
    Will return a cast expression for column, unless it's a default column, in which case the
    unchaged column will be returned.
    """
    target_type = get_db_type_enum_from_id(col_def["type"])
    if target_type is None:
        raise Exception(
            "Unknown db type id encountered. This should be handled in the request "
            + "validation phase. Something is wrong."
        )
    type_options = col_def.get("type_options", {})
    if not MathesarColumn.from_column(column).is_default:
        return (
            get_column_cast_expression(
                column=column,
                target_type=target_type,
                engine=engine,
                type_options=type_options,
            )
            .label(col_def["name"])
        )
    else:
        return column


def _to_executable(relation):
    """
    We want the relations to be in the form of executables in between transformations.
    Executables are a subset of selectables.
    """
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    if isinstance(relation, sqlalchemy.sql.expression.Executable):
        return relation
    else:
        return select(relation)


def _to_non_executable(relation):
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    if isinstance(relation, sqlalchemy.sql.expression.Executable):
        return relation.cte()
    else:
        return relation
