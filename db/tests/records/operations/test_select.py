from decimal import Decimal

from sqlalchemy import Column
from sqlalchemy import String

from db.records.operations.select import get_records, get_column_cast_records
from db.tables.operations.create import create_mathesar_table
from db.tests.types import fixtures


engine_with_types = fixtures.engine_with_types
temporary_testing_schema = fixtures.temporary_testing_schema
engine_email_type = fixtures.engine_email_type


def test_get_records_gets_all_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine)
    assert len(record_list) == 1000


def test_get_records_gets_limited_records(roster_table_obj):
    roster, engine = roster_table_obj
    record_list = get_records(roster, engine, limit=10)
    assert len(record_list) == 10


def test_get_records_gets_limited_offset_records(roster_table_obj):
    roster, engine = roster_table_obj
    base_records = get_records(roster, engine, limit=10)
    offset_records = get_records(roster, engine, limit=10, offset=5)
    assert len(offset_records) == 10 and offset_records[0] == base_records[5]


def test_get_column_cast_records(engine_email_type, temporary_testing_schema):
    COL1 = "col1"
    COL2 = "col2"
    col1 = Column(COL1, String)
    col2 = Column(COL2, String)
    column_list = [col1, col2]
    engine, schema = engine_email_type, temporary_testing_schema
    table_name = "table_with_columns"
    table = create_mathesar_table(
        table_name, schema, column_list, engine
    )
    ins = table.insert().values(
        [{COL1: 'one', COL2: 1}, {COL1: 'two', COL2: 2}]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    COL1_MOD = COL1 + "_mod"
    COL2_MOD = COL2 + "_mod"
    column_definitions = [
        {"name": "mathesar_id", "type": "INTEGER"},
        {"name": COL1_MOD, "type": "VARCHAR"},
        {"name": COL2_MOD, "type": "NUMERIC"},
    ]
    records = get_column_cast_records(engine, table, column_definitions)
    for record in records:
        assert (
            type(record[COL1 + "_mod"]) == str
            and type(record[COL2 + "_mod"]) == Decimal
        )


def test_get_column_cast_records_options(
        engine_email_type, temporary_testing_schema
):
    COL1 = "col1"
    COL2 = "col2"
    col1 = Column(COL1, String)
    col2 = Column(COL2, String)
    column_list = [col1, col2]
    engine, schema = engine_email_type, temporary_testing_schema
    table_name = "table_with_columns"
    table = create_mathesar_table(
        table_name, schema, column_list, engine
    )
    ins = table.insert().values(
        [{COL1: 'one', COL2: 1}, {COL1: 'two', COL2: 2}]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    COL1_MOD = COL1 + "_mod"
    COL2_MOD = COL2 + "_mod"
    column_definitions = [
        {"name": "mathesar_id", "type": "INTEGER"},
        {"name": COL1_MOD, "type": "VARCHAR"},
        {"name": COL2_MOD, "type": "NUMERIC", "type_options": {"precision": 5, "scale": 2}},
    ]
    records = get_column_cast_records(engine, table, column_definitions)
    for record in records:
        assert (
            type(record[COL1 + "_mod"]) == str
            and type(record[COL2 + "_mod"]) == Decimal
        )
