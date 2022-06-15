from sqlalchemy import String, Integer, Column, Table, MetaData

from db.columns.operations.drop import drop_column
from db.columns.operations.select import get_column_attnum_from_name
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid


def test_drop_column_correct_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "thecolumntodrop"
    nontarget_column_name = "notthecolumntodrop"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    drop_column(table_oid, column_attnum, engine)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 1
    assert nontarget_column_name in altered_table.columns
    assert target_column_name not in altered_table.columns
