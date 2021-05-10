import pytest
from sqlalchemy import Table, Column, String, MetaData
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
def test_schema(engine):
    schema = TEST_SCHEMA
    with engine.begin() as conn:
        conn.execute(CreateSchema(schema))
    yield engine, schema
    with engine.begin() as conn:
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
    (String, "money", "MONEY"),
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
