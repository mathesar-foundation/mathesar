import pytest
from unittest.mock import patch
import db.schemas.operations.drop as sch_drop


@pytest.mark.parametrize("cascade", [True, False])
def test_drop_schema(engine_with_schema, cascade):
    engine = engine_with_schema
    with patch.object(sch_drop, 'execute_msar_func_with_engine') as mock_exec:
        sch_drop.drop_schema_via_name(engine, 'drop_test_schema', cascade)
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "drop_schema"
    assert call_args[2] == "drop_test_schema"
    assert call_args[3] == cascade
