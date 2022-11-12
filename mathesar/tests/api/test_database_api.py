import pytest
from django.core.cache import cache
from sqlalchemy import text

from db.metadata import get_empty_metadata
from mathesar.database.base import create_mathesar_engine
from mathesar.state.django import reflect_db_objects
from mathesar.models.base import Table, Schema, Database


def _recreate_db(db_name):
    root_engine = create_mathesar_engine('default')
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {db_name} WITH (FORCE);"))
        conn.execute(text(f"CREATE DATABASE {db_name};"))


def _remove_db(db_name):
    root_engine = create_mathesar_engine('default')
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {db_name} WITH (FORCE);"))


@pytest.fixture
def test_db_name(worker_id):
    default_test_db_name = "mathesar_db_api_test"
    return f"{default_test_db_name}_{worker_id}"


@pytest.fixture
def db_dj_model(test_db_name):
    _recreate_db(test_db_name)
    db = Database.objects.get_or_create(name=test_db_name)[0]
    reflect_db_objects(get_empty_metadata())
    yield db
    _remove_db(test_db_name)
    db.delete()


def test_database_reflection_delete(db_dj_model):
    assert db_dj_model.deleted is False  # check DB is not marked deleted inappropriately
    _remove_db(db_dj_model.name)
    reflect_db_objects(get_empty_metadata())
    fresh_db_model = Database.objects.get(name=db_dj_model.name)
    assert fresh_db_model.deleted is True  # check DB is marked deleted appropriately


def test_database_reflection_delete_schema(db_dj_model):
    Schema.objects.create(oid=1, database=db_dj_model)
    # We expect the test schema + 'public'
    assert Schema.objects.filter(database=db_dj_model).count() == 2
    _remove_db(db_dj_model.name)
    reflect_db_objects(get_empty_metadata())
    assert Schema.objects.filter(database=db_dj_model).count() == 0


def test_database_reflection_delete_table(db_dj_model):
    schema = Schema.objects.create(oid=1, database=db_dj_model)
    Table.objects.create(oid=2, schema=schema)
    assert Table.objects.filter(schema__database=db_dj_model).count() == 1
    _remove_db(db_dj_model.name)
    reflect_db_objects(get_empty_metadata())
    assert Table.objects.filter(schema__database=db_dj_model).count() == 0


def check_database(database, response_database):
    assert database.id == response_database['id']
    assert database.name == response_database['name']
    assert database.deleted == response_database['deleted']
    assert 'supported_types_url' in response_database
    assert '/api/ui/v0/databases/' in response_database['supported_types_url']
    assert response_database['supported_types_url'].endswith('/types/')


def test_database_list(client, db_dj_model):
    response = client.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(db_dj_model, response_data['results'][0])


def test_database_list_deleted(client, db_dj_model):
    _remove_db(db_dj_model.name)
    cache.clear()
    response = client.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(db_dj_model, response_data['results'][0])


def test_database_detail(client, db_dj_model):
    response = client.get(f'/api/db/v0/databases/{db_dj_model.id}/')
    response_database = response.json()

    assert response.status_code == 200
    check_database(db_dj_model, response_database)
