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
    (String, "float", "1.2", "DOUBLE PRECISION"),
    (String, "int", "1", "INTEGER"),
    (String, "integer", "10", "INTEGER"),
    (String, "json", '{"my": "json", "a": 45}', "JSON"),
    (String, "jsonb", '{"my": "json", "a": 45}', "JSONB"),
    (String, "numeric", "12341234.3241234", "NUMERIC"),
    (String, "character varying", "mystringhere", "VARCHAR"),
    (String, "text", "abcdefg", "TEXT"),
    (String, "timestamp", "2020-01-01", "TIMESTAMP WITHOUT TIME ZONE"),
    (String, "uuid", "79a3387e-eada-4197-a330-54eb6810d3c8", "UUID"),
    (String, "email", "alice@example.com", "mathesar_types.email")
]


@pytest.mark.parametrize(
    "type_,target_type,value,expect_result", type_test_list
)
def test_alter_column_type_alters_column(
        engine_email_type, type_, target_type, value, expect_result
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
    input_table.insert(values=value)
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
    actual_result = actual_column.type.compile(dialect=engine.dialect)
    assert actual_result == expect_result
