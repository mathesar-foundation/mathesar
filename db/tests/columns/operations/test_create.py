import json
from unittest.mock import patch
import pytest

import db.columns.operations.create as col_create
from db.types.base import get_available_known_db_types, known_db_types


def test_type_list_completeness(engine):
    """
    Ensure that unavailable types are unavailable for a good reason.
    """
    actual_supported_db_types = get_available_known_db_types(engine)
    unavailable_types = set.difference(set(known_db_types), set(actual_supported_db_types))
    for db_type in unavailable_types:
        assert (
            db_type.is_inconsistent
            or db_type.is_optional
            or db_type.is_sa_only
        )


@pytest.mark.parametrize(
    "in_name,out_name", [('test1', 'test1'), ('', None), (None, None)]
)
def test_create_column_name(engine_with_schema, in_name, out_name):
    """
    Here, we just check that the PostgreSQL function is called properly, when
    given a (maybe empty) name param
    """
    engine, schema = engine_with_schema
    with patch.object(col_create.db_conn, "execute_msar_func_with_engine") as mock_exec:
        col_create.create_column(engine, 12345, {"name": in_name})
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_columns"
    assert call_args[2] == 12345
    assert json.loads(call_args[3])[0]["name"] == out_name


@pytest.mark.parametrize(
    "in_type,out_type", [("numeric", "numeric"), (None, "character varying")]
)
def test_create_column_type(engine_with_schema, in_type, out_type):
    """
    Here, we just check that the PostgreSQL function is called properly when
    given a (maybe empty) type
    """
    engine, schema = engine_with_schema
    with patch.object(col_create.db_conn, "execute_msar_func_with_engine") as mock_exec:
        col_create.create_column(engine, 12345, {"type": in_type})
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_columns"
    assert call_args[2] == 12345
    actual_col_data = json.loads(call_args[3])[0]
    assert actual_col_data["name"] is None
    assert actual_col_data["type"]["name"] == out_type
    assert actual_col_data["type"]["options"] == {}


@pytest.mark.parametrize(
    "in_options,out_options", [({"foo": "bar"}, {"foo": "bar"}), (None, None), ({}, {})]
)
def test_create_column_type_options(engine_with_schema, in_options, out_options):
    """
    Here, we just check that the PostgreSQL function is called properly when
    given a (maybe empty) type options dict.
    """
    engine, schema = engine_with_schema
    with patch.object(col_create.db_conn, "execute_msar_func_with_engine") as mock_exec:
        col_create.create_column(engine, 12345, {"type_options": in_options})
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_columns"
    assert call_args[2] == 12345
    assert json.loads(call_args[3])[0]["type"]["name"] == "character varying"
    assert json.loads(call_args[3])[0]["type"]["options"] == out_options


def test_duplicate_column_smoke(engine_with_schema):
    """This is just a smoke test, since the underlying function is trivial."""
    engine, schema = engine_with_schema
    with patch.object(col_create.db_conn, "execute_msar_func_with_engine") as mock_exec:
        col_create.duplicate_column(
            12345,
            4,
            engine,
            new_column_name='newcol',
            copy_data=False,
            copy_constraints=True
        )
    mock_exec.assert_called_once_with(
        engine, 'copy_column', 12345, 4, 'newcol', False, True
    )
