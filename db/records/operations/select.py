import json

from db import connection as db_conn


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
