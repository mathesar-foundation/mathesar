import pytest
from unittest.mock import patch
import db.schemas.operations.create as sch_create


@pytest.mark.parametrize(
    "if_not_exists", [(True), (False), (None)]
)
def test_create_schema(engine_with_schema, if_not_exists):
    engine = engine_with_schema
    with patch.object(sch_create, 'execute_msar_func_with_engine') as mock_exec:
        sch_create.create_schema(
            schema_name='new_schema',
            engine=engine,
            comment=None,
            if_not_exists=if_not_exists
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "create_schema"
    assert call_args[2] == "new_schema"
    assert call_args[3] == if_not_exists or False
