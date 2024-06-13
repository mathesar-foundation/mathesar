from unittest.mock import patch
import db.tables.operations.alter as tab_alter


def test_rename_table(engine_with_schema):
    engine, schema_name = engine_with_schema
    with patch.object(tab_alter.db_conn, 'execute_msar_func_with_engine') as mock_exec:
        tab_alter.rename_table('rename_me', schema_name, engine, rename_to='renamed')
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "rename_table"
    assert call_args[2] == schema_name
    assert call_args[3] == "rename_me"
    assert call_args[4] == "renamed"


def test_comment_on_table(engine_with_schema):
    engine, schema_name = engine_with_schema
    with patch.object(tab_alter.db_conn, 'execute_msar_func_with_engine') as mock_exec:
        tab_alter.comment_on_table(
            'comment_on_me',
            schema_name,
            engine=engine,
            comment='This is a comment'
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "comment_on_table"
    assert call_args[2] == schema_name
    assert call_args[3] == "comment_on_me"
    assert call_args[4] == "This is a comment"


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
    assert call_args[3] == {"name": "newname", "description": "this is a comment", "columns": {}}
