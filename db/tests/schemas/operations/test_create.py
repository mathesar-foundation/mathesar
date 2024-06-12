from unittest.mock import patch
from db.schemas.operations.create import create_schema_via_sql_alchemy


def test_create_schema_via_sql_alchemy(engine_with_schema):
    engine = engine_with_schema
    with patch.object(create_schema_via_sql_alchemy, 'execute_msar_func_with_engine') as mock_exec:
        create_schema_via_sql_alchemy(
            schema_name='new_schema',
            engine=engine,
            comment=None,
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "create_schema_via_sql_alchemy"
    assert call_args[2] == "new_schema"
