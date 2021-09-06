from sqlalchemy import Column, String
from unittest.mock import call, patch

from db.tables import ddl as table_ddl
from db.types import inference
from db.tests.types import fixtures


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_infer_table_column_types_doesnt_touch_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    table_name = "t1"
    table_ddl.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(inference, "infer_column_type") as mock_infer:
        inference.update_table_column_types(
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
    table_ddl.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(inference, "infer_column_type") as mock_infer:
        inference.update_table_column_types(
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
    table_ddl.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(inference, "infer_column_type") as mock_infer:
        inference.update_table_column_types(
            schema,
            table_name,
            engine
        )
    mock_infer.assert_not_called()


def test_update_table_column_types_skips_fkey_columns(extracted_remainder_roster, roster_fkey_col):
    _, remainder, _, engine, schema = extracted_remainder_roster
    with patch.object(inference, "infer_column_type") as mock_infer:
        inference.update_table_column_types(
            schema,
            remainder.name,
            engine
        )
    assert all([call_[1][2] != roster_fkey_col for call_ in mock_infer.mock_calls])
