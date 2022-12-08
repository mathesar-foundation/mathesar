from decimal import Decimal
from collections import Counter

from sqlalchemy import Column, VARCHAR

from db.records.operations.select import get_records, get_column_cast_records
from db.tables.operations.create import create_mathesar_table
from db.types.base import PostgresType


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


def test_get_column_cast_records(engine_with_schema):
    COL1 = "col1"
    COL2 = "col2"
    col1 = Column(COL1, VARCHAR)
    col2 = Column(COL2, VARCHAR)
    column_list = [col1, col2]
    engine, schema = engine_with_schema
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
        {"name": "id", "type": PostgresType.INTEGER.id},
        {"name": COL1_MOD, "type": PostgresType.CHARACTER_VARYING.id},
        {"name": COL2_MOD, "type": PostgresType.NUMERIC.id},
    ]
    records = get_column_cast_records(engine, table, column_definitions)
    for record in records:
        assert (
            type(record[COL1 + "_mod"]) == str
            and type(record[COL2 + "_mod"]) == Decimal
        )


def test_get_column_cast_records_options(engine_with_schema):
    COL1 = "col1"
    COL2 = "col2"
    col1 = Column(COL1, VARCHAR)
    col2 = Column(COL2, VARCHAR)
    column_list = [col1, col2]
    engine, schema = engine_with_schema
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
        {"name": "id", "type": PostgresType.INTEGER.id},
        {"name": COL1_MOD, "type": PostgresType.CHARACTER_VARYING.id},
        {"name": COL2_MOD, "type": PostgresType.NUMERIC.id, "type_options": {"precision": 5, "scale": 2}},
    ]
    records = get_column_cast_records(engine, table, column_definitions)
    for record in records:
        assert (
            type(record[COL1 + "_mod"]) == str
            and type(record[COL2 + "_mod"]) == Decimal
        )


def test_get_records_duplicate_only(roster_table_obj):
    roster, engine = roster_table_obj
    duplicate_only = ["Grade", "Subject"]

    full_record_list = get_records(roster, engine)
    dupe_record_list = get_records(roster, engine, duplicate_only=duplicate_only)

    # Ensures that:
    #   - All duplicate values in the table appeared in our query
    #   - All values in our query are duplicate values
    #   - All duplicate values appear the correct number of times
    all_counter = Counter(tuple(r[c] for c in duplicate_only) for r in full_record_list)
    all_counter = {k: v for k, v in all_counter.items() if v > 1}
    got_counter = Counter(tuple(r[c] for c in duplicate_only) for r in dupe_record_list)
    assert all_counter == got_counter
