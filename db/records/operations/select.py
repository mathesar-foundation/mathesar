import json
from sqlalchemy import select
from sqlalchemy.sql.functions import count

from db import connection as db_conn
from db.columns.base import MathesarColumn
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.types.operations.convert import get_db_type_enum_from_id
from db.utils import execute_pg_query
from db.transforms.operations.apply import apply_transformations_deprecated


def list_records_from_table(
        conn,
        table_oid,
        limit=None,
        offset=None,
        order=None,
        filter=None,
        group=None,
):
    """
    Get records from a table.

    The order definition objects should have the form
    {"attnum": <int>, "direction": <text>}

    Only data from which the user is granted `SELECT` is returned.

    Args:
        tab_id: The OID of the table whose records we'll get.
        limit: The maximum number of rows we'll return.
        offset: The number of rows to skip before returning records from
                 following rows.
        order: An array of ordering definition objects.
        filter: An array of filter definition objects.
        group: An array of group definition objects.
    """
    result = db_conn.exec_msar_func(
        conn,
        'list_records_from_table',
        table_oid,
        limit,
        offset,
        json.dumps(order) if order is not None else None,
        json.dumps(filter) if filter is not None else None,
        json.dumps(group) if group is not None else None,
    ).fetchone()[0]
    return result


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    pg_query = select(table).where(primary_key_column == id_value)
    result = execute_pg_query(engine, pg_query)
    assert len(result) <= 1
    return result[0] if result else None


# TODO consider using **kwargs instead of manually redefining defaults and piping all these arguments
def get_records(
    table,
    engine,
    limit=None,
    offset=None,
    order_by=None,
    filter=None,
    group_by=None,
    search=None,
    duplicate_only=None,
    fallback_to_default_ordering=False,
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
        filter:          a dictionary with one key-value pair, where the key is the filter id and
                         the value is a list of parameters; supports composition/nesting.
        group_by:        group.GroupBy object
        duplicate_only:  list of column names; only rows that have duplicates across those rows
                         will be returned
    """
    if order_by is None:
        order_by = []
    if search is None:
        search = []
    relation = apply_transformations_deprecated(
        table=table,
        limit=limit,
        offset=offset,
        order_by=order_by,
        fallback_to_default_ordering=fallback_to_default_ordering,
        filter=filter,
        group_by=group_by,
        search=search,
        duplicate_only=duplicate_only,
    )
    return execute_pg_query(engine, relation)


def get_count(table, engine, filter=None, search=None):
    if search is None:
        search = []
    col_name = "_count"
    columns_to_select = [
        count(1).label(col_name)
    ]
    relation = apply_transformations_deprecated(
        table=table,
        limit=None,
        offset=None,
        # TODO does it make sense to order, when we're only interested in row count?
        order_by=None,
        filter=filter,
        columns_to_select=columns_to_select,
        search=search,
    )
    return execute_pg_query(engine, relation)[0][col_name]


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
