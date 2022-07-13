from sqlalchemy import select, func
from sqlalchemy_filters import apply_sort
from sqlalchemy.sql.base import ColumnSet as SAColumnSet

from db.functions.operations.apply import apply_db_function_spec_as_filter
from db.columns.base import MathesarColumn
from db.records.operations import group
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
                         See: https://github.com/centerofci/sqlalchemy-filters#sort-format
        filter:          a dictionary with one key-value pair, where the key is the filter id and
                         the value is a list of parameters; supports composition/nesting.
                         See: https://github.com/centerofci/sqlalchemy-filters#filters-format
        group_by:        group.GroupBy object
        duplicate_only:  list of column names; only rows that have duplicates across those rows
                         will be returned
    """
    pg_query = get_pg_query(
        table=table,
        limit=limit,
        offset=offset,
        order_by=order_by,
        filter=filter,
        group_by=group_by,
        duplicate_only=duplicate_only
    )
    return execute_pg_query(engine, pg_query)


def get_count(table, engine, filter=None):
    col_name = "_count"
    columns_to_select = [func.count().label(col_name)]
    pg_query = get_pg_query(
        table=table,
        limit=None,
        offset=None,
        order_by=None,
        filter=filter,
        columns_to_select=columns_to_select
    )
    return execute_pg_query(engine, pg_query)[0][col_name]


# NOTE deprecated; this will be replaced with apply_transformations
def get_pg_query(
    table,
    limit=None,
    offset=None,
    order_by=None,
    filter=None,
    columns_to_select=None,
    group_by=None,
    duplicate_only=None,
    aggregate=None,
):
    # TODO do we really have to do this step ahead of all other steps? preferably we'd do it when
    # actually sorting
    # TODO can be solved by converting this into an implict transformation that's always applied first
    order_by = _process_order_by(table, order_by)

    selectable = table

    if duplicate_only:
        selectable = _get_duplicate_only_cte(selectable, duplicate_only)
    if group_by or aggregate:
        selectable = _group_aggregate(selectable, group_by, aggregate)
    if order_by:
        selectable = _sort(selectable, order_by)
    if filter:
        selectable = _filter(selectable, filter)
    if columns_to_select:
        selectable = _select_subset_of_columns(
            selectable,
            columns_to_select,)
    if limit:
        selectable = selectable.limit(limit)
    if offset:
        selectable = selectable.offset(offset)
    return selectable


# NOTE in this file, the terms relation and selectable are used interchangeably
def apply_transformations(relation, transformations):
    for transform in transformations:
        relation = _apply_transform(relation, transform)
    return relation


def _apply_transform(relation, transform):
    transform_type = transform['type']
    if transform_type == 'filter':
        filter_spec = transform.spec
        relation = _filter(relation, filter_spec)
    elif transform_type == 'order':
        order_spec = transform.spec
        relation = _sort(relation, order_spec)
    elif transform_type == 'group-agg':
        group_by_spec = transform.get('group_by')
        agg_spec = transform.get('agg')
        group_agged = _group_aggregate(relation, group_by_spec, agg_spec)
        relation = group_agged
    else:
        # TODO handle other transform types
        raise Exception("unexpected or tbd")
    return relation


# TODO do aggregation
def _group_aggregate(selectable, group_by, aggregate):
    # TODO maybe keep this as json, and convert to GroupBy at last moment?
    # other transform specs are json at this point in the pipeline
    if isinstance(group_by, group.GroupBy):
        selectable = group.get_group_augmented_records_pg_query(selectable, group_by)
    else:
        # TODO get rid of this branch
        selectable = select(selectable)
    return selectable


def _select_subset_of_columns(selectable, columns_to_select):
    if columns_to_select:
        selectable = selectable.cte()
        selectable = select(*columns_to_select).select_from(selectable)
    return selectable


def _process_order_by(table, order_by):
    if not order_by:
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
                    for col in pk_cols
                ]
        if not order_by:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.columns]
    return order_by


def _get_duplicate_only_cte(table, duplicate_columns):
    DUPLICATE_LABEL = "_is_dupe"
    duplicate_flag_cte = (
        select(
            *table.c,
            (func.count(1).over(partition_by=duplicate_columns) > 1).label(DUPLICATE_LABEL),
        ).select_from(table)
    ).cte()
    return select(duplicate_flag_cte).where(duplicate_flag_cte.c[DUPLICATE_LABEL]).cte()


def _sort(pg_query, order_by):
    if order_by is not None:
        pg_query = apply_sort(pg_query, order_by)
    return pg_query


def _filter(pg_query, filter):
    if filter is not None:
        pg_query = apply_db_function_spec_as_filter(pg_query, filter)
    return pg_query


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
