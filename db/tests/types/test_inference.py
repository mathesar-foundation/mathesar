import pytest
from sqlalchemy import Column, MetaData, Table, select
from sqlalchemy import BOOLEAN, Numeric, NUMERIC, String, VARCHAR
from db.tests.types import fixtures
from db.types import inference
from db import tables


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


def test_table_inference(engine_email_type):
    TYPES = [Numeric, Numeric, String, String, String, String]
    VALUES = [
        [0, 0, "t", "t", "a", "2"],
        [2, 1, "false", "false", "cat", "1"],
        [1, 1, "true", "2", "mat", "0"],
        [0, 0, "f", "0", "bat", "0"],
    ]
    EXPECTED_TYPES = [NUMERIC, BOOLEAN, BOOLEAN, VARCHAR, VARCHAR, NUMERIC]
    TEST_TABLE = "test_table"

    engine, schema = engine_email_type
    metadata = MetaData(bind=engine)

    columns = [Column("col_" + str(i), t) for i, t in enumerate(TYPES)]
    input_table = Table(
        TEST_TABLE,
        metadata,
        *columns,
        schema=schema
    )
    input_table.create()
    for row in VALUES:
        ins = input_table.insert(values=row)
        with engine.begin() as conn:
            conn.execute(ins)

    with engine.begin() as conn:
        results = conn.execute(select(input_table))
    original_table = results.fetchall()

    inferred_types = tables.infer_table_column_types(
        schema,
        TEST_TABLE,
        engine
    )
    assert inferred_types == EXPECTED_TYPES

    # Ensure the original table is untouced
    with engine.begin() as conn:
        results = conn.execute(select(input_table))
    new_table = results.fetchall()
    assert original_table == new_table
