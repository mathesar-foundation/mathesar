from sqlalchemy import select, func
from sqlalchemy_filters import apply_sort

from db.functions.operations.apply import apply_db_function_as_filter, apply_db_function_as_function
from db.functions.operations.deserialize import get_db_function_from_ma_function_spec
from db.columns.base import MathesarColumn
from db.records.operations import group
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.utils import execute_query


def _get_duplicate_only_cte(table, duplicate_columns):
    DUPLICATE_LABEL = "_is_dupe"
    duplicate_flag_cte = (
        select(
            *table.c,
            (func.count(1).over(partition_by=duplicate_columns) > 1).label(DUPLICATE_LABEL),
        ).select_from(table)
    ).cte()
    return select(duplicate_flag_cte).where(duplicate_flag_cte.c[DUPLICATE_LABEL]).cte()


def _sort_and_filter(query, order_by, filter):
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filter is not None:
        db_function = get_db_function_from_ma_function_spec(filter)
        query = apply_db_function_as_filter(query, db_function)
    return query


def get_query(
    table,
    limit=None,
    offset=None,
    order_by=None,
    filter=None,
    group_by=None,
    duplicate_only=None,
    db_function=None,
    deduplicate=False,
):
    if duplicate_only:
        select_target = _get_duplicate_only_cte(table, duplicate_only)
    else:
        select_target = table

    if isinstance(group_by, group.GroupBy):
        selectable = group.get_group_augmented_records_query(select_target, group_by)
    else:
        selectable = select(select_target)

    selectable = _sort_and_filter(selectable, order_by, filter)

    if db_function:
        db_function = get_db_function_from_ma_function_spec(db_function)
        selectable = apply_db_function_as_function(selectable, db_function)

    if deduplicate:
        selectable = selectable.distinct()

    selectable = selectable.limit(limit).offset(offset)
    return selectable


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records(
    table,
    engine,
    limit=None,
    offset=None,
    # TODO change to order_by=None
    order_by=[],
    filter=None,
    group_by=None,
    duplicate_only=None,
    db_function=None,
    deduplicate=False,
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
    if not order_by:
        # Set default ordering if none was requested
        if len(table.primary_key.columns) > 0:
            # If there are primary keys, order by all primary keys
            order_by = [{'field': str(col.name), 'direction': 'asc'}
                        for col in table.primary_key.columns]
        else:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.columns]
    query = get_query(
        table=table,
        limit=limit,
        offset=offset,
        order_by=order_by,
        filter=filter,
        group_by=group_by,
        duplicate_only=duplicate_only,
        db_function=db_function,
        deduplicate=deduplicate,
    )
    return execute_query(engine, query)


def get_count(
    table,
    engine,
    filter=None,
    db_function=None,
    deduplicate=False,
):
    col_name = "_count"
    count_column = func.count().label(col_name)
    selectable = get_query(
        table=table,
        limit=None,
        offset=None,
        order_by=None,
        filter=filter,
        db_function=db_function,
        deduplicate=deduplicate,
    )
    selectable = selectable.cte()
    selectable = select(count_column).select_from(selectable)
    return execute_query(engine, selectable)[0][col_name]


def get_column_cast_records(engine, table, column_definitions, num_records=20):
    assert len(column_definitions) == len(table.columns)
    cast_expression_list = [
        (
            get_column_cast_expression(
                column, col_def["type"],
                engine,
                type_options=col_def.get("type_options", {})
            )
            .label(col_def["name"])
        ) if not MathesarColumn.from_column(column).is_default else column
        for column, col_def in zip(table.columns, column_definitions)
    ]
    sel = select(cast_expression_list).limit(num_records)
    with engine.begin() as conn:
        result = conn.execute(sel)
    return result.fetchall()
