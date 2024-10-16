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
    "in_name,out_name", [("test1", "test1"), ("", None), (None, None)]
)
def test_add_columns_name(in_name, out_name):
    """
    Here, we just check that the PostgreSQL function is called properly, when
    given a (maybe empty) name param
    """
    with patch.object(col_create.db_conn, "exec_msar_func") as mock_exec:
        col_create.add_columns_to_table(123, [{"name": in_name}], "conn")
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == "conn"
    assert call_args[1] == "add_columns"
    assert call_args[2] == 123
    assert json.loads(call_args[3])[0]["name"] == out_name


@pytest.mark.parametrize(
    "in_type,out_type", [("numeric", "numeric"), (None, "character varying")]
)
def test_add_columns_type(in_type, out_type):
    """
    Here, we just check that the PostgreSQL function is called properly when
    given a (maybe empty) type
    """
    with patch.object(col_create.db_conn, "exec_msar_func") as mock_exec:
        col_create.add_columns_to_table(123, [{"type": in_type}], "conn")
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == "conn"
    assert call_args[1] == "add_columns"
    assert call_args[2] == 123
    actual_col_data = json.loads(call_args[3])[0]
    assert actual_col_data["name"] is None
    assert actual_col_data["type"]["name"] == out_type
    assert actual_col_data["type"]["options"] == {}


@pytest.mark.parametrize(
    "in_options,out_options", [({"foo": "bar"}, {"foo": "bar"}), (None, None), ({}, {})]
)
def test_add_columns_type_options(in_options, out_options):
    """
    Here, we just check that the PostgreSQL function is called properly when
    given a (maybe empty) type options dict.
    """
    with patch.object(col_create.db_conn, "exec_msar_func") as mock_exec:
        col_create.add_columns_to_table(123, [{"type_options": in_options}], "conn")
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == "conn"
    assert call_args[1] == "add_columns"
    assert call_args[2] == 123
    assert json.loads(call_args[3])[0]["type"]["name"] == "character varying"
    assert json.loads(call_args[3])[0]["type"]["options"] == out_options
