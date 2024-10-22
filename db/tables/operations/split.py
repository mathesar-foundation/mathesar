from db.connection import exec_msar_func


def split_table(
    conn,
    old_table_oid,
    extracted_column_attnums,
    extracted_table_name,
    relationship_fk_column_name=None
):
    extracted_table_oid, new_fkey_attnum = exec_msar_func(
        conn,
        'extract_columns_from_table',
        old_table_oid,
        extracted_column_attnums,
        extracted_table_name,
        relationship_fk_column_name
    ).fetchone()[0]
    return {
        'extracted_table_oid': extracted_table_oid,
        'new_fkey_attnum': new_fkey_attnum
    }
