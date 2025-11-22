import json
from unittest.mock import patch
from db import connection, tables


def test_get_table_info():
    with patch.object(connection, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = tables.get_table_info('schema', 'conn')
    mock_exec.assert_called_once_with('conn', 'get_table_info', 'schema')
    assert result == 'a'


def test_alter_table():
    with patch.object(connection, 'exec_msar_func') as mock_exec:
        tables.alter_table_on_database(
            12345,
            {"name": "newname", "description": "this is a comment", "columns": {}},
            "conn"
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == "conn"
    assert call_args[1] == "alter_table"
    assert call_args[2] == 12345
    assert call_args[3] == json.dumps({
        "name": "newname",
        "description": "this is a comment",
        "columns": {},
    })
