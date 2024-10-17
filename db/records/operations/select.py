import json
from sqlalchemy import select
from sqlalchemy.sql.functions import count

from db import connection as db_conn
from db.tables.utils import get_primary_key_column
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
        return_record_summaries=False
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
        return_record_summaries
    ).fetchone()[0]
    return result


def get_record_from_table(
        conn,
        record_id,
        table_oid,
        return_record_summaries=False
):
    """
    Get single record from a table by its primary key

    Only data from which the user is granted `SELECT` is returned.

    Args:
        record_id: The primary key value of the record.
        table_id: The OID of the table whose record we'll get.
    """
    result = db_conn.exec_msar_func(
        conn,
        'get_record_from_table',
        table_oid,
        record_id,
        return_record_summaries,
    ).fetchone()[0]
    return result


def search_records_from_table(
        conn,
        table_oid,
        search=[],
        limit=10,
        return_record_summaries=False,
):
    """
    Get records from a table, according to a search specification

    Only data from which the user is granted `SELECT` is returned.

    Args:
        tab_id: The OID of the table whose records we'll get.
        search: A list of dictionaries defining a search.
        limit: The maximum number of rows we'll return.

    The search definition objects should have the form
    {"attnum": <int>, "literal": <text>}
    """
    search = search or []
    result = db_conn.exec_msar_func(
        conn, 'search_records_from_table',
        table_oid, json.dumps(search), limit, return_record_summaries
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
