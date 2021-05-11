from datetime import datetime, date
from decimal import Decimal
from psycopg2.errors import InvalidTextRepresentation
import pytest
from sqlalchemy import Table, Column, MetaData
from sqlalchemy import String, Numeric
from sqlalchemy.schema import CreateSchema, DropSchema
from db import types
from db.engine import _add_custom_types_to_engine
from db.types import base, install

TEST_SCHEMA = "test_schema"


@pytest.fixture
def engine_with_types(engine):
    _add_custom_types_to_engine(engine)
    return engine


@pytest.fixture
def test_schema(engine_with_types):
    schema = TEST_SCHEMA
    with engine_with_types.begin() as conn:
        conn.execute(CreateSchema(schema))
    yield engine_with_types, schema
    with engine_with_types.begin() as conn:
        conn.execute(DropSchema(schema, cascade=True, if_exists=True))


@pytest.fixture
def engine_email_type(test_schema):
    engine, schema = test_schema
    install.install_mathesar_on_database(engine)
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


def test_get_alter_column_types_with_standard_engine(engine):
    type_dict = base.get_supported_alter_column_types(engine)
    assert len(type_dict) > 0
    assert all([type_ not in type_dict for type_ in types.CUSTOM_TYPE_DICT])


def test_get_alter_column_types_with_custom_engine(engine_with_types):
    type_dict = base.get_supported_alter_column_types(engine_with_types)
    assert all(
        [
            type_ in type_dict.values()
            for type_ in types.CUSTOM_TYPE_DICT.values()
        ]
    )


type_test_list = [
    (String, "boolean", "BOOLEAN"),
    (String, "float", "DOUBLE PRECISION"),
    (String, "int", "INTEGER"),
    (String, "integer", "INTEGER"),
    (String, "numeric", "NUMERIC"),
    (String, "string", "VARCHAR"),
    (String, "text", "TEXT"),
    (String, "timestamp", "TIMESTAMP WITHOUT TIME ZONE"),
    (String, "uuid", "UUID"),
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
    base.alter_column_type(
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
    (String, "boolean", "0", False),
    (String, "boolean", "1", True),
    (String, "boolean", "false", False),
    (String, "boolean", "true", True),
    (String, "boolean", "f", False),
    (String, "boolean", "t", True),
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
    base.alter_column_type(
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
        base.alter_column_type(
            schema, TABLE_NAME, COLUMN_NAME, target_type, engine,
        )
