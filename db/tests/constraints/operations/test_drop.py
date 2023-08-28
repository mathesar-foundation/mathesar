from unittest.mock import patch
import db.constraints.operations.drop as con_drop


def test_drop_constraint_db(engine_with_schema):
    engine, schema_name = engine_with_schema
    with patch.object(con_drop, 'execute_msar_func_with_engine') as mock_exec:
        con_drop.drop_constraint(
            engine=engine,
            schema_name=schema_name,
            table_name='test_table_name',
            constraint_name='test_constraint_name'
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "drop_constraint"
    assert call_args[2] == schema_name
    assert call_args[3] == "test_table_name"
    assert call_args[4] == "test_constraint_name"
