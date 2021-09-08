from sqlalchemy import select, func, true, and_
from sqlalchemy_filters import apply_filters, apply_sort
from sqlalchemy_filters.exceptions import BadFilterFormat, FilterFieldNotFound

from db.tables.utils import get_primary_key_column
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


def _create_query_with_duplicate_filter(table, duplicate_columns, cols=None):
    subq_table = table.alias()
    table_duplicate_columns = [c for c in table.c if c.name in duplicate_columns]
    subq_duplicate_columns = [c for c in subq_table.c if c.name in duplicate_columns]
    subq = (
        select(true().label(DUPLICATE_LABEL))
        .select_from(subq_table)
        .group_by(*subq_duplicate_columns)
        .having(and_(
            func.count() > 1,
            *[c == subq_c for c, subq_c in zip(table_duplicate_columns, subq_duplicate_columns)]
        ))
        .lateral("lateral_subq")
    )
    query = (
        select(*(cols or table.c))
        .select_from(table.join(subq, true()))
        .where(subq.c[DUPLICATE_LABEL])
    )
    return query


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


def get_query(table, limit, offset, order_by, filters, cols=None):
    duplicate_columns, filters = _get_duplicate_data_columns(table, filters)
    if duplicate_columns:
        query = _create_query_with_duplicate_filter(table, duplicate_columns, cols)
    else:
        query = select(*(cols or table.c)).select_from(table)

    query = query.limit(limit).offset(offset)
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        query = apply_filters(query, filters)
    return query


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records(
        table, engine, limit=None, offset=None, order_by=[], filters=[],
):
    """
    Returns records from a table.

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
    """
    if not order_by:
        # Set default ordering if none was requested
        if len(table.primary_key.columns) > 0:
            # If there are primary keys, order by all primary keys
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.primary_key.columns]
        else:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.columns]

    query = get_query(table, limit, offset, order_by, filters)
    return execute_query(engine, query)


def get_count(table, engine, filters=[]):
    col_name = "_count"
    cols = [func.count().label(col_name)]
    query = get_query(table, None, None, None, filters, cols)
    return execute_query(engine, query)[0][col_name]
