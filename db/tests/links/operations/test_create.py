import pytest
from unittest.mock import patch
import db.links.operations.create as link_create


@pytest.mark.parametrize(
    "unique_link", [(True), (False), (None)]
)
def test_create_foreign_key_link(engine_with_schema, unique_link):
    engine = engine_with_schema
    with patch.object(link_create, 'execute_msar_func_with_engine') as mock_exec:
        link_create.create_foreign_key_link(
            engine=engine,
            referent_table_oid=12345,
            referrer_table_oid=54321,
            referrer_column_name='actor_id',
            unique_link=unique_link
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_foreign_key_column"
    assert call_args[2] == "actor_id"
    assert call_args[3] == 54321
    assert call_args[4] == 12345
    assert call_args[5] == unique_link or False


def test_many_to_many_link(engine_with_schema):
    engine = engine_with_schema
    referents = {'referent_table_oids': [12345, 54321], 'column_names': ['movie_id', 'actor_id']}
    with patch.object(link_create, 'execute_msar_func_with_engine') as mock_exec:
        link_create.create_many_to_many_link(
            engine=engine,
            schema_oid=2200,
            referents_dict=referents,
            map_table_name='movies_actors'
        )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == engine
    assert call_args[1] == "add_mapping_table"
    assert call_args[2] == 2200
    assert call_args[3] == "movies_actors"
    assert call_args[4] == [
        {"column_name": "movie_id", "referent_table_oid": 12345},
        {"column_name": "actor_id", "referent_table_oid": 54321}
    ]
