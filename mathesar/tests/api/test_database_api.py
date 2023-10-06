from mathesar.models.users import DatabaseRole
from mathesar.models.base import Database
from conftest import _drop_database


# TODO should be moved, not an API test
def test_database_reflection_delete(test_db_model, SES_engine_cache):
    _drop_database(test_db_model._sa_engine, SES_engine_cache)
    test_db_model.reset_reflection()
    fresh_db_model = Database.objects.get(name=test_db_model.name)
    assert not fresh_db_model.is_connectable()


def check_database(database, response_database):
    assert database.id == response_database['id']
    assert database.name == response_database['name']
    assert 'supported_types_url' in response_database
    assert '/api/ui/v0/databases/' in response_database['supported_types_url']
    assert response_database['supported_types_url'].endswith('/types/')


def test_database_list(client, test_db_model):
    response = client.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(test_db_model, response_data['results'][0])


def test_database_list_permissions(FUN_create_dj_db, get_uid, client, client_bob, client_alice, user_bob, user_alice):
    db1 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db1, role='viewer')
    DatabaseRole.objects.create(user=user_alice, database=db1, role='viewer')

    db2 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db2, role='manager')
    DatabaseRole.objects.create(user=user_alice, database=db2, role='editor')

    db3 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db3, role='editor')

    response = client_bob.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 3

    response = client_alice.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 2


def test_database_list_deleted(client, test_db_model, SES_engine_cache):
    _drop_database(test_db_model._sa_engine, SES_engine_cache)
    response = client.get('/api/db/v0/databases/')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_database(test_db_model, response_data['results'][0])


def test_database_detail(client, test_db_model):
    response = client.get(f'/api/db/v0/databases/{test_db_model.id}/')
    response_database = response.json()

    assert response.status_code == 200
    check_database(test_db_model, response_database)


def test_database_detail_permissions(FUN_create_dj_db, get_uid, client_bob, client_alice, user_bob, user_alice):
    db1 = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=db1, role='viewer')

    response = client_bob.get(f'/api/db/v0/databases/{db1.id}/')
    assert response.status_code == 200

    response = client_alice.get(f'/api/db/v0/databases/{db1.id}/')
    assert response.status_code == 404
