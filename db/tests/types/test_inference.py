import pytest
from sqlalchemy import Column, MetaData, Table
from sqlalchemy import BOOLEAN, Numeric, NUMERIC, String, VARCHAR
from db.tests.types import fixtures
from db.types import inference


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


type_data_list = [
    (Numeric, [0, 2, 1, 0], NUMERIC),
    (Numeric, [0, 1, 1, 0], BOOLEAN),
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
