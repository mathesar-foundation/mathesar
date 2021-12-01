from sqlalchemy import select, func
from sqlalchemy_filters import apply_filters, apply_sort

from db.columns.base import MathesarColumn
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.utils import execute_query
from db.filters.operations.deserialize import get_predicate_from_MA_filter_spec
from db.filters.operations.serialize import get_SA_filter_spec_from_predicate


def get_query(table, limit, offset, order_by, filters, cols=None):
    query = select(*(cols or table.c)).select_from(table).limit(limit).offset(offset)
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filters is not None:
        predicate = get_predicate_from_MA_filter_spec(filters)
        sa_filter_spec = get_SA_filter_spec_from_predicate(predicate)
        query = apply_filters(query, sa_filter_spec)
    return query


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records(
        table, engine, limit=None, offset=None, order_by=[], filters=None,
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
