import json

from db import connection as db_conn


def _json_or_none(value):
    return json.dumps(value) if value is not None else None


def list_records_from_table(
        conn,
        table_oid,
        limit=None,
        offset=None,
        order=None,
        filter=None,
        group=None,
        return_record_summaries=False,
        table_record_summary_templates=None,
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
        return_record_summaries: Whether to return self record summaries.
        table_record_summary_templates: A dict of record summary templates, per table.
    """
    result = db_conn.exec_msar_func(
        conn,
        'list_records_from_table',
        table_oid,
        limit,
        offset,
        _json_or_none(order),
        _json_or_none(filter),
        _json_or_none(group),
        return_record_summaries,
        _json_or_none(table_record_summary_templates),
    ).fetchone()[0]
    return result


def get_record_from_table(
        conn,
        record_id,
        table_oid,
        return_record_summaries=False,
        table_record_summary_templates=None,
):
    """
    Get single record from a table by its primary key

    Only data from which the user is granted `SELECT` is returned.

    Args:
        record_id: The primary key value of the record.
        table_id: The OID of the table whose record we'll get.
        return_record_summaries: Whether to return self record summaries.
        table_record_summary_templates: A dict of record summary templates, per table.
    """
    result = db_conn.exec_msar_func(
        conn,
        'get_record_from_table',
        table_oid,
        record_id,
        return_record_summaries,
        _json_or_none(table_record_summary_templates),
    ).fetchone()[0]
    return result


def search_records_from_table(
        conn,
        table_oid,
        search=[],
        limit=10,
        return_record_summaries=False,
        table_record_summary_templates=None,
):
    """
    Get records from a table, according to a search specification

    Only data from which the user is granted `SELECT` is returned.

    Args:
        tab_id: The OID of the table whose records we'll get.
        search: A list of dictionaries defining a search.
        limit: The maximum number of rows we'll return.
        return_record_summaries: Whether to return self record summaries.
        table_record_summary_templates: A dict of record summary templates, per table.

    The search definition objects should have the form
    {"attnum": <int>, "literal": <text>}
    """
    search = search or []
    result = db_conn.exec_msar_func(
        conn,
        'search_records_from_table',
        table_oid,
        json.dumps(search),
        limit,
        return_record_summaries,
        _json_or_none(table_record_summary_templates),
    ).fetchone()[0]
    return result


def delete_records_from_table(conn, record_ids, table_oid):
    """
    Delete records from table by id.

    Args:
        tab_id: The OID of the table whose record we'll delete.
        record_ids: A list of primary values

    The table must have a single primary key column.
    """
    return db_conn.exec_msar_func(
        conn,
        'delete_records_from_table',
        table_oid,
        json.dumps(record_ids),
    ).fetchone()[0]


def add_record_to_table(
        conn,
        record_def,
        table_oid,
        return_record_summaries=False,
        table_record_summary_templates=None,
    ):
    """Add a record to a table."""
    result = db_conn.exec_msar_func(
        conn,
        'add_record_to_table',
        table_oid,
        json.dumps(record_def),
        return_record_summaries,
        _json_or_none(table_record_summary_templates),
    ).fetchone()[0]
    return result


def patch_record_in_table(
        conn,
        record_def,
        record_id,
        table_oid,
        return_record_summaries=False,
        table_record_summary_templates=None,
    ):
    """Update a record in a table."""
    result = db_conn.exec_msar_func(
        conn,
        'patch_record_in_table',
        table_oid,
        record_id,
        json.dumps(record_def),
        return_record_summaries,
        _json_or_none(table_record_summary_templates),
    ).fetchone()[0]
    return result
