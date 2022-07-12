from decimal import Decimal
from collections import Counter

from sqlalchemy import Column, VARCHAR

from db.records.operations.select import get_records, get_column_cast_records, get_records_preview_data
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


def test_foreign_key_record(relation_table_obj):
    preview_columns = {}
    referent_table, referrer_table, engine = relation_table_obj
    fk_column_name = "person"
    preview_columns[referent_table.name] = {
        'table': referent_table,
        'preview_columns': ["Name"],
        'constraint_columns': [
            {
                'referent_column': 'id',
                'constrained_column': fk_column_name
            }
        ]
    }
    records = get_records(
        referrer_table,
        engine,
        order_by=[{'field': "id", 'direction': "asc"}],
    )
    preview_records = get_records_preview_data(records, engine, preview_columns)
    expected_preview = [
        {
            'table': referent_table.name,
            'data': [
                (1, 'Stephanie Norris', 'stephanienorris@hotmail.com'),
                (2, 'Shannon Ramos', 'shannonramos@gmail.com'),
                (3, 'Tyler Harris', 'tylerharris@hotmail.com'),
                (4, 'Lee Henderson', 'leehenderson@yahoo.com'),
                (5, 'Christopher Bell', 'christopherbell@hotmail.com')
            ]
        }
    ]
    assert preview_records == expected_preview
    expected_record_data = {
        'id': 1,
        'person': 1,
        'teacher': 6,
        'supplementary': None,
        'Name': 'Physics',
        'Score': 43
    }
    assert records[0]._asdict() == expected_record_data


def test_multiple_column_same_table_relation_foreign_key_record(relation_table_obj):
    preview_columns = {}
    referent_table, referrer_table, engine = relation_table_obj
    fk_column1_name = "person"
    fk_column2_name = "teacher"
    preview_columns[referent_table.name] = {
        'table': referent_table,
        'preview_columns': ["Name"],
        'constraint_columns': [
            {
                'referent_column': 'id',
                'constrained_column': fk_column1_name
            },
            {
                'referent_column': 'id',
                'constrained_column': fk_column2_name
            }
        ]
    }
    records = get_records(
        referrer_table,
        engine,
        order_by=[{'field': "id", 'direction': "asc"}],
    )
    record_index = 3
    expected_record_data_dict = {
        'Name': 'Biology',
        'Score': 41,
        'id': 4,
        'person': 1,
        'supplementary': None,
        'teacher': 8,
    }
    preview_records = get_records_preview_data(records, engine, preview_columns)
    expected_preview = [
        {
            'table': referent_table.name,
            'data': [
                (1, 'Stephanie Norris', 'stephanienorris@hotmail.com'),
                (2, 'Shannon Ramos', 'shannonramos@gmail.com'),
                (3, 'Tyler Harris', 'tylerharris@hotmail.com'),
                (4, 'Lee Henderson', 'leehenderson@yahoo.com'),
                (5, 'Christopher Bell', 'christopherbell@hotmail.com'),
                (6, 'Mary Carroll', 'marycarroll@hotmail.com'),
                (8, 'Evelyn Anderson', 'evelynanderson@hotmail.com'),
                (9, 'Bethany Bell', 'bethanybell@gmail.com'),
                (10, 'Carolyn Durham', 'carolyndurham@gmail.com')
            ]
        }
    ]
    assert records[record_index]._asdict() == expected_record_data_dict
    assert preview_records == expected_preview


def test_self_referential_relation_foreign_key_record(relation_table_obj):
    preview_columns = {}
    referent_table, referrer_table, engine = relation_table_obj
    fk_column1_name = "person"
    preview_columns[referent_table.name] = {
        'table': referent_table,
        'preview_columns': ["Name"],
        'constraint_columns': [
            {
                'referent_column': 'id',
                'constrained_column': fk_column1_name
            },
        ]
    }
    fk_column2_name = "supplementary"
    preview_columns[referrer_table.name] = {
        'table': referrer_table,
        'preview_columns': ["Name"],
        'constraint_columns': [
            {
                'referent_column': 'id',
                'constrained_column': fk_column2_name
            },
        ]
    }
    records = get_records(
        referrer_table,
        engine,
        order_by=[{'field': "id", 'direction': "asc"}],
    )
    record_index = 7
    expected_record_data_dict = {
        'Name': 'Art',
        'Score': 31,
        'id': 8,
        'person': 2,
        'supplementary': 3,
        'teacher': 10
    }
    assert records[record_index]._asdict() == expected_record_data_dict
    preview_records = get_records_preview_data(records, engine, preview_columns)
    expected_preview = [
        {
            'table': referent_table.name,
            'data': [
                (1, 'Stephanie Norris', 'stephanienorris@hotmail.com'),
                (2, 'Shannon Ramos', 'shannonramos@gmail.com'),
                (3, 'Tyler Harris', 'tylerharris@hotmail.com'),
                (4, 'Lee Henderson', 'leehenderson@yahoo.com'),
                (5, 'Christopher Bell', 'christopherbell@hotmail.com')
            ]
        },
        {
            'table': referrer_table.name,
            'data': [
                (1, 1, 6, None, 'Physics', 43),
                (3, 1, 8, None, 'Chemistry', 55),
                (6, 2, 6, None, 'Math', 44),
                (10, 2, 9, None, 'Music', 40)
            ]
        },

    ]
    assert records[record_index]._asdict() == expected_record_data_dict
    assert preview_records == expected_preview
