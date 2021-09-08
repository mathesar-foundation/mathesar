from sqlalchemy import select

from db import columns
from db.tables.operations.create import create_mathesar_table
from db.tables.utils import reflect_table


def merge_tables(table_name_one, table_name_two, merged_table_name, schema, engine, drop_original_tables=False):
    """
    This specifically undoes the `extract_columns_from_table` (up to
    unique rows).  It may not work in other contexts (yet).
    """
    table_one = reflect_table(table_name_one, schema, engine)
    table_two = reflect_table(
        table_name_two, schema, engine, metadata=table_one.metadata
    )
    merge_join = table_one.join(table_two)
    referencing_columns = [
        col for col in [merge_join.onclause.left, merge_join.onclause.right]
        if col.foreign_keys
    ]
    merged_columns_all = [
        columns.MathesarColumn.from_column(col)
        for col in list(table_one.columns) + list(table_two.columns)
        if col not in referencing_columns
    ]
    merged_columns = [col for col in merged_columns_all if not col.is_default]
    with engine.begin() as conn:
        merged_table = create_mathesar_table(
            merged_table_name, schema, merged_columns, engine,
        )
        insert_stmt = merged_table.insert().from_select(
            [col.name for col in merged_columns],
            select(merged_columns, distinct=True).select_from(merge_join)
        )
        conn.execute(insert_stmt)

    if drop_original_tables:
        if table_one.foreign_keys:
            table_one.drop(bind=engine)
            table_two.drop(bind=engine)
        else:
            table_two.drop(bind=engine)
            table_one.drop(bind=engine)

    return merged_table
