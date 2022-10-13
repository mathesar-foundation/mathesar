import pytest
from unittest.mock import patch
from django.core.cache import cache

from mathesar.models.base import Database, Schema, Table, schema_utils
from mathesar.utils.models import attempt_dumb_query


def test_schema_name_sets_cache(monkeypatch, test_db_model):
    monkeypatch.setattr(
        Schema, '_sa_engine', lambda x: None
    )
    monkeypatch.setattr(
        schema_utils, 'get_schema_name_from_oid', lambda *_: 'myname'
    )
    cache.clear()
    schema = Schema(oid=123, database=test_db_model)
    name = schema.name
    assert cache.get(f"{schema.database.name}_schema_name_{schema.oid}") == name


def test_schema_name_uses_cache(monkeypatch, test_db_model):
    monkeypatch.setattr(
        Schema, '_sa_engine', lambda _: None
    )
    cache.clear()
    with patch.object(
            schema_utils, 'get_schema_name_from_oid', return_value='myname'
    ) as mock_get_name:
        schema = Schema(oid=123, database=test_db_model)
        name_one = schema.name
        name_two = schema.name
    assert name_one == name_two
    assert mock_get_name.call_count == 1


def test_schema_name_handles_missing(monkeypatch, test_db_model):
    monkeypatch.setattr(
        Schema, '_sa_engine', lambda _: None
    )
    cache.clear()

    def mock_name_getter(*_):
        raise TypeError
    monkeypatch.setattr(
        schema_utils, 'get_schema_name_from_oid', mock_name_getter
    )
    schema = Schema(oid=123, database=test_db_model)
    name_ = schema.name
    assert name_ == 'MISSING'


@pytest.mark.parametrize("model", [Database, Schema, Table])
def test_model_queryset_reflects_db_objects(model):
    with patch('mathesar.state.base.reflect_db_objects') as mock_reflect:
        model.objects.all()
    mock_reflect.assert_called()


@pytest.mark.parametrize("model", [Database, Schema, Table])
def test_model_current_queryset_does_not_reflects_db_objects(model):
    with patch('mathesar.state.base.reflect_db_objects') as mock_reflect:
        model.current_objects.all()
    mock_reflect.assert_not_called()


@pytest.mark.parametrize('iteration', range(2))
def test_database_engine_cache_stability(FUN_create_dj_db, iteration, uid):
    """
    We are using an engine cache to minimize new engine creations; however, a cached engine might
    unexpectedly fail if its underlying database is dropped and then recreated. This test checks
    that that is transparently handled.

    This test uses two iterations: first one creates a database, populates our engine cache, then
    drops the database during cleanup; the second, recreates the database, fetches a cached engine,
    and tests it.
    """
    del iteration  # An unused parameter
    some_db_name = uid
    FUN_create_dj_db(some_db_name)
    db_model, _ = Database.objects.get_or_create(name=some_db_name)
    attempt_dumb_query(db_model._sa_engine)
