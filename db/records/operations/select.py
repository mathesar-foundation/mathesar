from sqlalchemy import select, func, text
from sqlalchemy_filters import apply_sort

from db.columns.base import MathesarColumn
from db.records.operations import group
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.utils import execute_query
from db.filters.operations.apply import apply_ma_filter_spec


def _get_duplicate_only_cte(table, duplicate_columns):
    DUPLICATE_LABEL = "_is_dupe"
    duplicate_flag_cte = (
        select(
            *table.c,
            (func.count(1).over(partition_by=duplicate_columns) > 1).label(DUPLICATE_LABEL),
        ).select_from(table)
    ).cte()
    return select(duplicate_flag_cte).where(duplicate_flag_cte.c[DUPLICATE_LABEL]).cte()


def _sort_and_filter(query, order_by, filters):
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        query = apply_ma_filter_spec(query, filters)
    return query


def get_query(
    table,
    limit=None,
    offset=None,
    order_by=None,
    filters=None,
    duplicate_only=None,
    # Currently columns_to_select is only set by get_count
    columns_to_select=None,
    group_by=None
):
    if duplicate_only:
        select_target = _get_duplicate_only_cte(table, duplicate_only)
    else:
        select_target = table

    if isinstance(group_by, group.GroupBy):
        selectable = group.get_group_augmented_records_query(select_target, group_by)
    else:
        selectable = select(select_target)

    selectable = _sort_and_filter(selectable, order_by, filters)

    if columns_to_select:
        selectable = selectable.cte()
        selectable = select(*columns_to_select).select_from(selectable)

    selectable = selectable.limit(limit).offset(offset)

    return selectable


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


# TODO update doc for filters and duplicate_only
# TODO handle columns specified in order_by, filters, duplicate_only not existing on the table
def get_records(
    table, engine, limit=None, offset=None, order_by=[], filters=None, duplicate_only=None, group_by=None,
):
    """
    Returns annotated records from a table.

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
        group_by: group.GroupBy object
    """
    if not order_by:
        # Set default ordering if none was requested
        # NOTE: str(col.name) must be used, because otherwise the table's identifier is
        # included which clashes with CTE aliases.
        if len(table.primary_key.columns) > 0:
            # If there are primary keys, order by all primary keys
            order_by = [{'field': str(col.name), 'direction': 'asc'}
                        for col in table.primary_key.columns]
        else:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': str(col.name), 'direction': 'asc'}
                        for col in table.columns]

    query = get_query(
        table=table, limit=limit, offset=offset, order_by=order_by,
        filters=filters, duplicate_only=duplicate_only, group_by=group_by
    )
    return execute_query(engine, query)


def get_count(table, engine, filters=None):
    col_name = "_count"
    columns_to_select = [func.count().label(col_name)]
    query = get_query(table=table, filters=filters, columns_to_select=columns_to_select)
    return execute_query(engine, query)[0][col_name]


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
