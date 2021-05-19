import pytest
from sqlalchemy import Column, MetaData, Table
from sqlalchemy import BOOLEAN, String, NUMERIC, VARCHAR
from sqlalchemy.schema import CreateSchema, DropSchema
from db.engine import _add_custom_types_to_engine
from db.types import base, inference, install

TEST_SCHEMA = "test_schema"


@pytest.fixture
def engine_with_types(engine):
    _add_custom_types_to_engine(engine)
    return engine


@pytest.fixture
def temporary_testing_schema(engine_with_types):
    schema = TEST_SCHEMA
    with engine_with_types.begin() as conn:
        conn.execute(CreateSchema(schema))
    yield engine_with_types, schema
    with engine_with_types.begin() as conn:
        conn.execute(DropSchema(schema, cascade=True, if_exists=True))


@pytest.fixture
def engine_email_type(temporary_testing_schema):
    engine, schema = temporary_testing_schema
    install.install_mathesar_on_database(engine)
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


type_data_list = [
    (String, ["t", "false", "true", "f", "f"], BOOLEAN),
    (String, ["t", "false", "2", "0"], VARCHAR),
    (String, ["a", "cat", "mat", "bat"], VARCHAR),
    (String, ["2", "1", "0", "0"], NUMERIC),
]


@pytest.mark.parametrize("type_,value_list,expect_type", type_data_list)
def test_type_inference(engine_email_type, type_, value_list, expect_type):
    engine, schema = engine_email_type
    TEST_TABLE = "test_table"
    TEST_COLUMN = "test_column"
    metadata = MetaData(bind=engine)
    print(value_list)
    input_table = Table(
        TEST_TABLE,
        metadata,
        Column(TEST_COLUMN, type_),
        schema=schema
    )
    input_table.create()
    for value in value_list:
        ins = input_table.insert(values=(value,))
        with engine.begin() as conn:
            conn.execute(ins)
    inference.infer_column_type(
        schema,
        TEST_TABLE,
        TEST_COLUMN,
        engine
    )
    with engine.begin():
        metadata = MetaData(bind=engine, schema=schema)
        actual_type = Table(
            TEST_TABLE, metadata, schema=schema, autoload_with=engine,
        ).columns[TEST_COLUMN].type.__class__
    assert actual_type == expect_type
