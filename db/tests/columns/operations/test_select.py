from unittest.mock import patch
from sqlalchemy import String, Integer, Column, Table, MetaData, inspect
from db.columns.operations import select as col_select
from db.columns.operations.select import (
    get_column_attnum_from_name,
    get_column_name_from_attnum
)
from db.metadata import get_empty_metadata


def _get_oid_from_table(name, schema, engine):
    inspector = inspect(engine)
    return inspector.get_table_oid(name, schema=schema)


def test_get_column_info_for_table():
    with patch.object(col_select, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = col_select.get_column_info_for_table('table', 'conn')
    mock_exec.assert_called_once_with('conn', 'get_column_info', 'table')
    assert result == 'a'


def test_get_attnum_from_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    zero_name = "colzero"
    one_name = "colone"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(zero_name, Integer),
        Column(one_name, String),
    )
    table.create()
    table_oid = _get_oid_from_table(table_name, schema, engine)
    metadata = get_empty_metadata()
    column_zero_attnum = get_column_attnum_from_name(table_oid, zero_name, engine, metadata=metadata)
    column_one_attnum = get_column_attnum_from_name(table_oid, one_name, engine, metadata=metadata)
    assert get_column_name_from_attnum(table_oid, column_zero_attnum, engine, metadata=metadata) == zero_name
    assert get_column_name_from_attnum(table_oid, column_one_attnum, engine, metadata=metadata) == one_name
