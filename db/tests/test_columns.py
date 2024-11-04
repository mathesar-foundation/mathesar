import json
from unittest.mock import patch
import pytest

from db import columns


def test_get_column_info_for_table():
    with patch.object(columns, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = columns.get_column_info_for_table('table', 'conn')
    mock_exec.assert_called_once_with('conn', 'get_column_info', 'table')
    assert result == 'a'


def test_alter_columns_in_table_basic():
    with patch.object(columns, 'exec_msar_func') as mock_exec:
        columns.alter_columns_in_table(
            123,
            [
                {
                    "id": 3, "name": "colname3", "type": "numeric",
                    "type_options": {"precision": 8}, "nullable": True,
                    "default": {"value": 8, "is_dynamic": False},
                    "description": "third column"
                }, {
                    "id": 6, "name": "colname6", "type": "character varying",
                    "type_options": {"length": 32}, "nullable": True,
                    "default": {"value": "blahblah", "is_dynamic": False},
                    "description": "textual column"
                }
            ],
            'conn'
        )
        expect_json_arg = [
            {
                "attnum": 3, "name": "colname3",
                "type": {"name": "numeric", "options": {"precision": 8}},
                "not_null": False, "default": 8, "description": "third column",
            }, {
                "attnum": 6, "name": "colname6",
                "type": {
                    "name": "character varying", "options": {"length": 32},
                },
                "not_null": False, "default": "blahblah",
                "description": "textual column"
            }
        ]
        assert mock_exec.call_args.args[:3] == ('conn', 'alter_columns', 123)
        # Necessary since `json.dumps` mangles dict ordering, but we don't care.
        assert json.loads(mock_exec.call_args.args[3]) == expect_json_arg


@pytest.mark.parametrize(
    "in_name,out_name", [("test1", "test1"), ("", None), (None, None)]
)
def test_add_columns_name(in_name, out_name):
    """
    Here, we just check that the PostgreSQL function is called properly, when
    given a (maybe empty) name param
    """
    with patch.object(columns, "exec_msar_func") as mock_exec:
        columns.add_columns_to_table(123, [{"name": in_name}], "conn")
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
    with patch.object(columns, "exec_msar_func") as mock_exec:
        columns.add_columns_to_table(123, [{"type": in_type}], "conn")
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
    with patch.object(columns, "exec_msar_func") as mock_exec:
        columns.add_columns_to_table(123, [{"type_options": in_options}], "conn")
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == "conn"
    assert call_args[1] == "add_columns"
    assert call_args[2] == 123
    assert json.loads(call_args[3])[0]["type"]["name"] == "character varying"
    assert json.loads(call_args[3])[0]["type"]["options"] == out_options


def test_drop_columns():
    with patch.object(columns, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: (3,)
        result = columns.drop_columns_from_table(123, [1, 3, 5], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1, 3, 5)
    assert result == 3


def test_drop_columns_single():
    with patch.object(columns, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: (1,)
        result = columns.drop_columns_from_table(123, [1], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1)
    assert result == 1
