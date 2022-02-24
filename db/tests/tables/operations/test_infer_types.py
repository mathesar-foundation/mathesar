import pytest
from unittest.mock import call, patch
from sqlalchemy import Column, MetaData, Table, select
from sqlalchemy import BOOLEAN, Numeric, NUMERIC, String, VARCHAR
from sqlalchemy.dialects.postgresql import MONEY

from db.columns.operations.infer_types import infer_column_type
from db.tables.operations import infer_types as infer_operations
from db.tables.operations.create import create_mathesar_table
from db.tests.types import fixtures
from db.types import email, uri, datetime


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
    (String, ["$2", "$1", "$0"], MONEY),
    (
        String,
        ["2000-01-12", "6/23/2004", "May-2007-29", "May-2007-29 00:00:00+0", "20200909"],
        datetime.DATE
    ),
    (String, ["9:24+01", "23:12", "03:04:05", "3:4:5"], datetime.TIME_WITHOUT_TIME_ZONE),
    (
        String,
        ["2000-01-12 9:24", "6/23/2004 23:12", "May-2007-29 03:04:05", "May-2007-29 5:00:00+0", "May-2007-29", "20200909 3:4:5"],
        datetime.TIMESTAMP_WITHOUT_TIME_ZONE
    ),
    (
        String,
        ["2000-01-12 9:24-3", "6/23/2004 23:12+01", "May-2007-29 03:04:05", "May-2007-29", "20200909 3:4:5+01:30"],
        datetime.TIMESTAMP_WITH_TIME_ZONE
    ),
    (
        String,
        ["alice@example.com", "bob@example.com", "jon.doe@example.ca"],
        email.Email
    ),
    (
        String,
        [
            "https://centerofci.org",
            "ldap://[2001:db8::7]/c=GB?objectClass?one"
            "mailto:John.Doe@example.com",
            "news:comp.infosystems.www.servers.unix",
            "tel:+1-816-555-1212",
            "telnet://192.0.2.16:80/",
            "urn:oasis:names:specification:docbook:dtd:xml:4.1.2",
            "centerofci.org",
            "nasa.gov",
            "lwn.net",
            "github.com",
        ],
        uri.URI
    ),
]


def create_test_table(engine, schema, table_name, column_name, column_type, values):
    metadata = MetaData(bind=engine)
    input_table = Table(
        table_name,
        metadata,
        Column(column_name, column_type),
        schema=schema
    )
    input_table.create()
    for value in values:
        ins = input_table.insert(values=(value,))
        with engine.begin() as conn:
            conn.execute(ins)
    return input_table


@pytest.mark.parametrize("type_,value_list,expect_type", type_data_list)
def test_type_inference(engine_email_type, type_, value_list, expect_type):
    engine, schema = engine_email_type
    TEST_TABLE = "test_table"
    TEST_COLUMN = "test_column"
    create_test_table(
        engine, schema, TEST_TABLE, TEST_COLUMN, type_, value_list
    )

    infer_column_type(
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


@pytest.mark.parametrize("type_,value_list,expect_type", type_data_list)
def test_table_inference(engine_email_type, type_, value_list, expect_type):
    engine, schema = engine_email_type
    TEST_TABLE = "test_table"
    TEST_COLUMN = "test_column"
    input_table = create_test_table(
        engine, schema, TEST_TABLE, TEST_COLUMN, type_, value_list
    )

    with engine.begin() as conn:
        results = conn.execute(select(input_table))
    original_table = results.fetchall()

    inferred_types = infer_operations.infer_table_column_types(
        schema,
        TEST_TABLE,
        engine
    )
    assert inferred_types == [expect_type]

    # Ensure the original table is untouced
    with engine.begin() as conn:
        results = conn.execute(select(input_table))
    new_table = results.fetchall()
    assert original_table == new_table


def test_table_inference_drop_temp(engine_email_type):
    engine, schema = engine_email_type
    TEST_TABLE = "test_table"
    TEST_COLUMN = "test_column"
    TYPE = Numeric
    VALUES = [0, 1, 2, 3, 4]
    create_test_table(engine, schema, TEST_TABLE, TEST_COLUMN, TYPE, VALUES)

    # Ensure that the temp table is deleted even when the function errors
    with patch.object(infer_operations, "infer_column_type") as mock_infer:
        mock_infer.side_effect = Exception()
        with pytest.raises(Exception):
            infer_operations.infer_table_column_types(schema, TEST_TABLE, engine)
    infer_operations.infer_table_column_types(schema, TEST_TABLE, engine)


def test_table_inference_same_name(engine_email_type):
    engine, schema = engine_email_type
    TEST_TABLE = "temp_table"
    TEST_COLUMN = "test_column"
    TYPE = Numeric
    VALUES = [0, 1, 2, 3, 4]
    table = create_test_table(engine, schema, TEST_TABLE, TEST_COLUMN, TYPE, VALUES)
    with engine.begin() as conn:
        results = conn.execute(select(table))
    original_table = results.fetchall()
    infer_operations.infer_table_column_types(schema, TEST_TABLE, engine)
    with engine.begin() as conn:
        results = conn.execute(select(table))
    new_table = results.fetchall()
    assert original_table == new_table


def test_infer_table_column_types_doesnt_touch_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    table_name = "t1"
    create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(infer_operations, "infer_column_type") as mock_infer:
        infer_operations.update_table_column_types(
            schema,
            table_name,
            engine
        )
    mock_infer.assert_not_called()


def test_update_table_column_types_infers_non_default_types(engine_with_schema):
    col1 = Column("col1", String)
    col2 = Column("col2", String)
    column_list = [col1, col2]
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(infer_operations, "infer_column_type") as mock_infer:
        infer_operations.update_table_column_types(
            schema,
            table_name,
            engine
        )
    expect_calls = [
        call(
            schema,
            table_name,
            col1.name,
            engine,
        ),
        call(
            schema,
            table_name,
            col2.name,
            engine,
        ),
    ]
    mock_infer.assert_has_calls(expect_calls)


def test_update_table_column_types_skips_pkey_columns(engine_with_schema):
    column_list = [Column("checkcol", String, primary_key=True)]
    engine, schema = engine_with_schema
    table_name = "t1"
    create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(infer_operations, "infer_column_type") as mock_infer:
        infer_operations.update_table_column_types(
            schema,
            table_name,
            engine
        )
    mock_infer.assert_not_called()


def test_update_table_column_types_skips_fkey_columns(extracted_remainder_roster, roster_fkey_col):
    _, remainder, _, engine, schema = extracted_remainder_roster
    with patch.object(infer_operations, "infer_column_type") as mock_infer:
        infer_operations.update_table_column_types(
            schema,
            remainder.name,
            engine
        )
    assert all([call_[1][2] != roster_fkey_col for call_ in mock_infer.mock_calls])
