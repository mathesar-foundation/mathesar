import pytest
from unittest.mock import patch
import db.schemas.operations.drop as sch_drop


@pytest.mark.parametrize(
    "cascade, if_exists", [(True, True), (False, True), (True, False), (False, False)]
)
def test_drop_schema(engine_with_schema, cascade, if_exists):
    engine = engine_with_schema
    with patch.object(sch_drop, 'execute_msar_func_with_engine') as mock_exec:
        sch_drop.drop_schema('drop_test_schema', engine, cascade, if_exists)
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "drop_schema"
    assert call_args[2] == "drop_test_schema"
    assert call_args[3] == cascade
    assert call_args[4] == if_exists
