from unittest.mock import patch
import db.schemas.operations.alter as sch_alter


def test_rename_schema(engine_with_schema):
    engine = engine_with_schema
    with patch.object(sch_alter, 'execute_msar_func_with_engine') as mock_exec:
        sch_alter.rename_schema('rename_me', engine, rename_to='renamed')
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "rename_schema"
    assert call_args[2] == "rename_me"
    assert call_args[3] == "renamed"


def test_comment_on_schema(engine_with_schema):
    engine = engine_with_schema
    with patch.object(sch_alter, 'execute_msar_func_with_engine') as mock_exec:
        sch_alter.comment_on_schema(
            schema_name='comment_on_me',
            engine=engine,
            comment='This is a comment'
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "comment_on_schema"
    assert call_args[2] == "comment_on_me"
    assert call_args[3] == "This is a comment"
