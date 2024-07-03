import pytest
from unittest.mock import patch
import db.constraints.operations.create as con_create
from db.constraints.base import UniqueConstraint, ForeignKeyConstraint


@pytest.mark.parametrize(
    "constraint_obj", [
        (UniqueConstraint(
            name='test_uq_con',
            table_oid=12345,
            columns_attnum=[80085, 53301]
        )),
        (ForeignKeyConstraint(
            name='test_fk_con',
            table_oid=12345,
            columns_attnum=[80085],
            referent_table_oid=54321,
            referent_columns_attnum=[53301],
            options={'match_type': 'f', 'on_update': 'r', 'on_delete': 'c'}
        ))]
)
def test_add_constraint_db(engine_with_schema, constraint_obj):
    engine = engine_with_schema
    with patch.object(con_create, 'execute_msar_func_with_engine') as mock_exec:
        con_create.add_constraint_via_sql_alchemy(
            engine=engine,
            constraint_obj=constraint_obj
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_constraints"
    assert call_args[2] == constraint_obj.table_oid
    assert call_args[3] == constraint_obj.get_constraint_def_json()
