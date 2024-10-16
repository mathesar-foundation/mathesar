import json

from unittest.mock import patch
import db.tables.operations.alter as tab_alter


def test_alter_table():
    with patch.object(tab_alter.db_conn, 'exec_msar_func') as mock_exec:
        tab_alter.alter_table_on_database(
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
