from db.connection import exec_msar_func


def move_columns_to_referenced_table(conn, source_table_oid, target_table_oid, move_column_attnums):
    exec_msar_func(
        conn,
        'move_columns_to_referenced_table',
        source_table_oid,
        target_table_oid,
        move_column_attnums
    )
