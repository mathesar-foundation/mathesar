from sqlalchemy import select
from db.functions.base import ArrayAgg, ColumnName
from db.functions.operations.apply import db_function_to_sa_expression

from db.tables.operations.select import reflect_table

def test_custom_type_aggregation(uris_table_obj):
    """
    Our custom types can break during array_agg with output looking something like: 

    `['{', 'h', 't', 't', 'p', ':', '/', '/', 's', 'o', ...]`

    This is meant to test that that doesn't happen.
    """
    uris_table, engine = uris_table_obj
    # Apparently we need to reflect to have up-to-date column type
    uris_table = reflect_table(
        name=uris_table.name,
        schema=uris_table.schema,
        engine=engine,
        metadata=uris_table.metadata
    )
    uri_col = uris_table.c.uri
    uri_col_name = uri_col.name
    db_function = ArrayAgg([ColumnName([uri_col_name])])
    sa_expression = db_function_to_sa_expression(db_function)
    relation = select(sa_expression).select_from(uris_table)
    breakpoint()
    records = list(engine.connect().execute(relation))
    assert records[0][0][0] != "{"
