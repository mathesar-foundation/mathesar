from sqlalchemy import select, func
from sqlalchemy_filters import apply_sort
from sqlalchemy_filters.exceptions import BadFilterFormat, FilterFieldNotFound

from db.functions.operations.apply import apply_ma_function_spec_as_filter
from db.columns.base import MathesarColumn
from db.records.operations import group
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.utils import execute_query


DUPLICATE_LABEL = "_is_dupe"
CONJUNCTIONS = ("and", "or", "not")


def _validate_nested_ops(filters):
    for op in filters:
        if op.get("op") == "get_duplicates":
            raise BadFilterFormat("get_duplicates can not be nested")
        for field in CONJUNCTIONS:
            if field in op:
                _validate_nested_ops(op[field])


def _get_duplicate_only_cte(table, duplicate_columns):
    duplicate_flag_cte = (
        select(
            *table.c,
            (func.count(1).over(partition_by=duplicate_columns) > 1).label(DUPLICATE_LABEL),
        ).select_from(table)
    ).cte()
    return select(duplicate_flag_cte).where(duplicate_flag_cte.c[DUPLICATE_LABEL]).cte()


def _get_duplicate_data_columns(table, filters):
    try:
        duplicate_ops = [f for f in filters if f.get("op") == "get_duplicates"]
        non_duplicate_ops = [f for f in filters if f.get("op") != "get_duplicates"]
    except AttributeError:
        # Ignore formatting errors - they will be handled by sqlalchemy_filters
        return None, filters

    _validate_nested_ops(non_duplicate_ops)
    if len(duplicate_ops) > 1:
        raise BadFilterFormat("get_duplicates can only be specified a single time")
    elif len(duplicate_ops) == 1:
        duplicate_cols = duplicate_ops[0]['value']
        for col in duplicate_cols:
            if col not in table.c:
                raise FilterFieldNotFound(f"Table {table.name} has no column `{col}`.")
        return duplicate_ops[0]['value'], non_duplicate_ops
    else:
        return None, filters


def get_query(table, limit, offset, order_by, filter, cols=None, group_by=None):
    # TODO
    duplicate_columns, filters = _get_duplicate_data_columns(table, filter)
    if duplicate_columns:
        select_target = _get_duplicate_only_cte(table, duplicate_columns)
    else:
        select_target = table

    if isinstance(group_by, group.GroupBy):
        query = group.get_group_augmented_records_query(table, group_by)
    else:
        query = select(*(cols or select_target.c)).select_from(select_target)

    query = query.limit(limit).offset(offset)
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filter is not None:
        query = apply_ma_function_spec_as_filter(query, filter)
    return query


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records(
        table, engine, limit=None, offset=None, order_by=[], filter=None, group_by=None,
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
        filter:   a dictionary with one key-value pair, where the key is the filter id and the
                  value is a list of parameters; supports composition/nesting.
                  See: https://github.com/centerofci/sqlalchemy-filters#filters-format
        group_by: group.GroupBy object
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

    query = get_query(table, limit, offset, order_by, filter, group_by=group_by)
    return execute_query(engine, query)


def get_count(table, engine, filter=None):
    col_name = "_count"
    cols = [func.count().label(col_name)]
    query = get_query(table, None, None, None, filter, cols)
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
