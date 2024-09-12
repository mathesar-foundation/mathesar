from db.connection import execute_msar_func_with_engine, exec_msar_func


def extract_columns_from_table(
        old_table_oid, extracted_column_attnums, extracted_table_name, schema,
        engine, relationship_fk_column_name=None
):
    curr = execute_msar_func_with_engine(
        engine, 'extract_columns_from_table',
        old_table_oid,
        extracted_column_attnums,
        extracted_table_name,
        relationship_fk_column_name
    )
    extracted_table_oid, new_fkey_attnum = curr.fetchone()[0]
    return extracted_table_oid, old_table_oid, new_fkey_attnum


def split_table(
    conn,
    old_table_oid,
    extracted_column_attnums,
    extracted_table_name,
    relationship_fk_column_name=None
):
    exec_msar_func(
        conn,
        'extract_columns_from_table',
        old_table_oid,
        extracted_column_attnums,
        extracted_table_name,
        relationship_fk_column_name
    )
