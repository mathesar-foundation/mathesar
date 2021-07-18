from datetime import timedelta
from decimal import Decimal
import pytest
from sqlalchemy import Table, Column, MetaData
from sqlalchemy import String, Numeric
from db import types
from db.tests.types import fixtures
from db.types import alteration


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_get_alter_column_types_with_standard_engine(engine):
    type_dict = alteration.get_supported_alter_column_types(engine)
    assert len(type_dict) > 0
    assert all([type_ not in type_dict for type_ in types.CUSTOM_TYPE_DICT])


def test_get_alter_column_types_with_custom_engine(engine_with_types):
    type_dict = alteration.get_supported_alter_column_types(engine_with_types)
    assert all(
        [
            type_ in type_dict.values()
            for type_ in types.CUSTOM_TYPE_DICT.values()
        ]
    )


def test_get_alter_column_types_with_unfriendly_names(engine_with_types):
    type_dict = alteration.get_supported_alter_column_types(
        engine_with_types, friendly_names=False
    )
    assert all(
        [
            type_dict[type_]().compile(dialect=engine_with_types.dialect) == type_
            for type_ in type_dict
        ]
    )


type_test_list = [
    (String, "boolean", "BOOLEAN"),
    (String, "interval", "INTERVAL"),
    (String, "numeric", "NUMERIC"),
    (String, "string", "VARCHAR"),
    (String, "email", "mathesar_types.email"),
]


@pytest.mark.parametrize(
    "type_,target_type,expect_type", type_test_list
)
def test_alter_column_type_alters_column_type(
        engine_email_type, type_, target_type, expect_type
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, type_),
        schema=schema
    )
    input_table.create()
    alteration.alter_column_type(
        schema, TABLE_NAME, COLUMN_NAME, target_type, engine,
    )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_column = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    ).columns[COLUMN_NAME]
    actual_type = actual_column.type.compile(dialect=engine.dialect)
    assert actual_type == expect_type


type_test_data_list = [
    (String, "boolean", "false", False),
    (String, "boolean", "true", True),
    (String, "boolean", "f", False),
    (String, "boolean", "t", True),
    (String, "interval", "1 day", timedelta(days=1)),
    (String, "interval", "1 week", timedelta(days=7)),
    (String, "interval", "3:30", timedelta(hours=3, minutes=30)),
    (String, "interval", "00:03:30", timedelta(minutes=3, seconds=30)),
    (String, "numeric", "1", 1.0),
    (String, "numeric", "1.2", Decimal('1.2')),
    (Numeric, "numeric", 1, 1.0),
    (String, "numeric", "5", 5),
    (String, "numeric", "500000", 500000),
    (String, "numeric", "500000.134", Decimal("500000.134")),
    (Numeric, "string", 3, "3"),
    (String, "string", "abc", "abc"),
    (String, "email", "alice@example.com", "alice@example.com"),
]


@pytest.mark.parametrize(
    "type_,target_type,value,expect_value", type_test_data_list
)
def test_alter_column_type_casts_column_data(
        engine_email_type, type_, target_type, value, expect_value,
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, type_),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
    alteration.alter_column_type(
        schema, TABLE_NAME, COLUMN_NAME, target_type, engine,
    )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_table = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    )
    sel = actual_table.select()
    with engine.connect() as conn:
        res = conn.execute(sel).fetchall()
    actual_value = res[0][0]
    assert actual_value == expect_value


type_test_bad_data_list = [
    (String, "boolean", "cat"),
    (String, "interval", "1 potato"),
    (String, "interval", "3"),
    (String, "numeric", "abc"),
    (String, "email", "alice-example.com"),
]


@pytest.mark.parametrize(
    "type_,target_type,value", type_test_bad_data_list
)
def test_alter_column_type_raises_on_bad_column_data(
        engine_email_type, type_, target_type, value,
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, type_),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
    with pytest.raises(Exception):
        alteration.alter_column_type(
            schema, TABLE_NAME, COLUMN_NAME, target_type, engine,
        )


def test_get_full_cast_map(engine_with_types):
    """
    This test specifies the full map of what types can be cast to what
    target types in Mathesar.  When the map is modified, this test
    should be updated accordingly.
    """
    expect_cast_map = {
        'NUMERIC': ['BOOLEAN', 'NUMERIC', 'VARCHAR'],
        'VARCHAR': ['NUMERIC', 'VARCHAR', 'INTERVAL', 'mathesar_types.email', 'BOOLEAN'],
        'mathesar_types.email': ['mathesar_types.email', 'VARCHAR'],
        'INTERVAL': ['INTERVAL', 'VARCHAR'],
        'BOOLEAN': ['NUMERIC', 'BOOLEAN', 'VARCHAR']
    }
    actual_cast_map = alteration.get_full_cast_map(engine_with_types)
    assert len(actual_cast_map) == len(expect_cast_map)
    assert all(
        [
            sorted(actual_cast_map[type_]) == sorted(expect_target_list)
            for type_, expect_target_list in expect_cast_map.items()
        ]
    )
