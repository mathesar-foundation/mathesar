import pytest
from django.core.cache import cache
from sqlalchemy import text

from db.metadata import get_empty_metadata
from mathesar.models.users import DatabaseRole
from mathesar.state.django import reflect_db_objects
from mathesar.models.base import Table, Schema, Database
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from db.install import install_mathesar
from db.engine import create_future_engine_with_custom_types


def _recreate_db(db_name):
    credentials = settings.DATABASES['default']
    root_engine = create_future_engine_with_custom_types(
        credentials['USER'],
        credentials['PASSWORD'],
        credentials['HOST'],
        credentials['NAME'],
        credentials['PORT']
    )
    with root_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {db_name} WITH (FORCE);"))
        conn.execute(text(f"CREATE DATABASE {db_name};"))


def _remove_db(db_name):
    credentials = settings.DATABASES['default']
    root_engine = create_future_engine_with_custom_types(
        credentials['USER'],
        credentials['PASSWORD'],
        credentials['HOST'],
        credentials['NAME'],
        credentials['PORT']
    )
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
    db = Database.objects.get_or_create(
        name=test_db_name,
        defaults={
            'db_name': test_db_name,
            'username': 'mathesar',
            'password': 'mathesar',
            'host': 'mathesar_dev_db',
            'port': 5432
        }
    )[0]
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
    assert database.name == response_database['nickname']
    assert 'supported_types_url' in response_database
    assert '/api/ui/v0/connections/' in response_database['supported_types_url']
    assert response_database['supported_types_url'].endswith('/types/')


def test_database_list(client, db_dj_model):
    response = client.get('/api/db/v0/connections/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(db_dj_model, response_data['results'][0])


def test_database_list_permissions(FUN_create_dj_db, get_uid, client, client_bob, client_alice, user_bob, user_alice):
    db1 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db1, role='viewer')
    DatabaseRole.objects.create(user=user_alice, database=db1, role='viewer')

    db2 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db2, role='manager')
    DatabaseRole.objects.create(user=user_alice, database=db2, role='editor')

    db3 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db3, role='editor')

    response = client_bob.get('/api/db/v0/connections/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 3

    response = client_alice.get('/api/db/v0/connections/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 2


def test_database_list_deleted(client, db_dj_model):
    # Note that there is no longer a distinction between "deleted" and undeleted
    # connections in the API.
    _remove_db(db_dj_model.name)
    cache.clear()
    response = client.get('/api/db/v0/connections/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(db_dj_model, response_data['results'][0])


def test_delete_dbconn_with_msar_schemas(client, db_dj_model):
    # install mathesar specific schemas
    install_mathesar(
        db_dj_model.name,
        db_dj_model.username,
        db_dj_model.password,
        db_dj_model.host,
        db_dj_model.port,
        True
    )
    engine = db_dj_model._sa_engine
    check_schema_exists = text(
        "SELECT schema_name FROM information_schema.schemata \
        WHERE schema_name LIKE '%msar' OR schema_name = 'mathesar_types';"
    )
    with engine.connect() as conn:
        before_deletion = conn.execute(check_schema_exists)
        response = client.delete(f'/api/db/v0/connections/{db_dj_model.id}/?del_msar_schemas=true')
        after_deletion = conn.execute(check_schema_exists)

    with pytest.raises(ObjectDoesNotExist):
        Database.objects.get(id=db_dj_model.id)
    assert response.status_code == 204
    assert before_deletion.rowcount == 3
    assert after_deletion.rowcount == 0


def test_database_detail(client, db_dj_model):
    response = client.get(f'/api/db/v0/connections/{db_dj_model.id}/')
    response_database = response.json()

    assert response.status_code == 200
    check_database(db_dj_model, response_database)


def test_database_detail_permissions(FUN_create_dj_db, get_uid, client_bob, client_alice, user_bob, user_alice):
    db1 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db1, role='viewer')

    response = client_bob.get(f'/api/db/v0/connections/{db1.id}/')
    assert response.status_code == 200

    response = client_alice.get(f'/api/db/v0/connections/{db1.id}/')
    assert response.status_code == 404
