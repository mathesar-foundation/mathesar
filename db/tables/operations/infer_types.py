from db.connection import exec_msar_func


def infer_table_column_data_types(conn, table_oid):
    """
    Infer the best type for each column in the table.

    Currently we only suggest different types for columns which originate
    as type `text`.

    Args:
        tab_id: The OID of the table whose columns we're inferring types for.

    The response JSON will have attnum keys, and values will be the
    result of `format_type` for the inferred type of each column.
    Restricted to columns to which the user has access.
    """
    return exec_msar_func(
        conn, 'infer_table_column_data_types', table_oid
    ).fetchone()[0]
