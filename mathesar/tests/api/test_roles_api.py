from django.db import transaction

from mathesar.models.base import Database, Schema
from mathesar.models.users import DatabaseRole, SchemaRole


def test_database_role_list(client, user_bob):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client.get(f'/api/ui/v0/databases/{database.id}/database_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == response_data['count']
    role_data = response_data['results'][0]
    assert 'id' in role_data
    assert role_data['user'] == user_bob.id
    assert role_data['role'] == role
    assert role_data['database'] == database.id


def test_schema_role_list(client, user_bob):
    role = 'manager'
    schema = Schema.objects.all()[0]
    database = schema.database
    SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.get(f'/api/ui/v0/databases/{database.id}/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == response_data['count']
    role_data = response_data['results'][0]
    assert 'id' in role_data
    assert role_data['user'] == user_bob.id
    assert role_data['role'] == role
    assert role_data['schema'] == schema.id


def test_database_role_detail(client, user_bob):
    role = 'editor'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client.get(f'/api/ui/v0/databases/{database.id}/database_roles/{database_role.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_detail(client, user_bob):
    role = 'editor'
    schema = Schema.objects.all()[0]
    database = schema.database
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.get(f'/api/ui/v0/databases/{database.id}/schema_roles/{schema_role.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id


def test_database_role_update(client, user_bob):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)
    data = {'user': user_bob.id, 'role': role, 'database': database.id}

    response = client.put(f'/api/ui/v0/databases/{database.id}/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_update(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    database = schema.database
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.put(f'/api/ui/v0/databases/{database.id}/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_partial_update(client, user_bob):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/databases/{database.id}/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_partial_update(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    database = schema.database
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/databases/{database.id}/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_create(client, user_bob):
    role = 'editor'
    database = Database.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id}

    response = client.post(f'/api/ui/v0/databases/{database.id}/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_create(client, user_bob):
    role = 'editor'
    schema = Schema.objects.all()[0]
    database = schema.database
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.post(f'/api/ui/v0/databases/{database.id}/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id


def test_database_role_create_with_incorrect_role(client, user_bob):
    role = 'nonsense'
    database = Database.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id}

    response = client.post(f'/api/ui/v0/databases/{database.id}/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2081


def test_schema_role_create_with_incorrect_role(client, user_bob):
    role = 'nonsense'
    schema = Schema.objects.all()[0]
    database = schema.database
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.post(f'/api/ui/v0/databases/{database.id}/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2081


def test_database_role_create_with_incorrect_database(client, user_bob):
    role = 'editor'
    database = Database.objects.order_by('-id')[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id + 1}

    response = client.post(f'/api/ui/v0/databases/{database.id}/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2151


def test_schema_role_create_with_incorrect_schema(client, user_bob):
    role = 'editor'
    schema = Schema.objects.order_by('-id')[0]
    database = schema.database
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id + 1}

    response = client.post(f'/api/ui/v0/databases/{database.id}/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2151


def test_database_role_destroy(client, user_bob):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client.delete(f'/api/ui/v0/databases/{database.id}/database_roles/{database_role.id}/')
    assert response.status_code == 204


def test_schema_role_destroy(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    database = schema.database
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.delete(f'/api/ui/v0/databases/{database.id}/schema_roles/{schema_role.id}/')
    assert response.status_code == 204


def test_database_role_create_multiple_roles_on_same_object(client, user_bob):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role=role)
    data = {'user': user_bob.id, 'role': 'editor', 'database': database.id}

    # The IntegrityError triggered here was causing issues with tearing down the
    # pytest user fixture. This answer suggested this solution:
    # https://stackoverflow.com/a/23326971/287415
    with transaction.atomic():
        response = client.post(f'/api/ui/v0/databases/{database.id}/database_roles/', data)
        response_data = response.json()

        assert response.status_code == 500
        assert response_data[0]['code'] == 4201


def test_schema_role_create_multiple_roles_on_same_object(client, user_bob):
    role = 'manager'
    schema = Schema.objects.all()[0]
    database = schema.database
    SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'user': user_bob.id, 'role': 'editor', 'schema': schema.id}

    # The IntegrityError triggered here was causing issues with tearing down the
    # pytest user fixture. This answer suggested this solution:
    # https://stackoverflow.com/a/23326971/287415
    with transaction.atomic():
        response = client.post(f'/api/ui/v0/databases/{database.id}/schema_roles/', data)
        response_data = response.json()

        assert response.status_code == 500
        assert response_data[0]['code'] == 4201
