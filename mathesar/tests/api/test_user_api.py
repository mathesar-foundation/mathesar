from django.db import transaction

from mathesar.models.base import Database, Schema
from mathesar.models.users import User, DatabaseRole, SchemaRole


def test_user_list(client):
    response = client.get('/api/ui/v0/users/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] >= 1
    assert len(response_data['results']) == response_data['count']


def test_user_detail(client, admin_user):
    response = client.get(f'/api/ui/v0/users/{admin_user.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['username'] == 'admin'
    assert 'password' not in response_data
    assert response_data['email'] == 'admin@example.com'
    assert response_data['is_superuser'] is True
    assert response_data['database_roles'] == []
    assert response_data['schema_roles'] == []


def test_same_user_detail_as_non_superuser(client_bob, user_bob):
    response = client_bob.get(f'/api/ui/v0/users/{user_bob.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['username'] == 'bob'
    assert 'password' not in response_data
    assert response_data['email'] == 'bob@example.com'
    assert response_data['is_superuser'] is False
    assert response_data['database_roles'] == []
    assert response_data['schema_roles'] == []


def test_diff_user_detail_as_non_superuser(client_bob, admin_user):
    response = client_bob.get(f'/api/ui/v0/users/{admin_user.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['username'] == 'admin'
    assert 'password' not in response_data
    # email should not be visible
    assert 'email' not in response_data
    assert response_data['is_superuser'] is True
    assert response_data['database_roles'] == []
    assert response_data['schema_roles'] == []


def test_user_patch(client, admin_user):
    desired_full_name = 'Administrator'
    desired_short_name = 'Admin'

    # Check that the names are not present
    initial_response = client.get(f'/api/ui/v0/users/{admin_user.id}/')
    initial_response_data = initial_response.json()
    assert initial_response.status_code == 200
    assert initial_response_data['full_name'] is None
    assert initial_response_data['full_name'] is None

    # Change the names
    data = {'full_name': desired_full_name, 'short_name': desired_short_name}
    response = client.patch(f'/api/ui/v0/users/{admin_user.id}/', data)
    response_data = response.json()

    # Ensure the names are changed
    assert response.status_code == 200
    assert response_data['full_name'] == desired_full_name
    assert response_data['short_name'] == desired_short_name


def test_user_patch_different_user(client_bob, user_alice):
    # Change name
    data = {'short_name': 'Bob'}
    response = client_bob.patch(f'/api/ui/v0/users/{user_alice.id}/', data)

    assert response.status_code == 403
    assert response.json()[0]['code'] == 4004


def test_user_create(client):
    data = {
        'username': 'alice',
        'email': 'alice@example.com',
        'password': 'password',
        'short_name': 'Alice',
        'full_name': 'Alice Jones'
    }
    response = client.post('/api/ui/v0/users/', data)
    response_data = response.json()

    # Ensure the names are changed
    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['username'] == data['username']
    assert response_data['email'] == data['email']
    assert 'password' not in response_data
    assert response_data['short_name'] == data['short_name']
    assert response_data['full_name'] == data['full_name']

    # clean up
    User.objects.get(id=response_data['id']).delete()


def test_user_create_no_superuser(client_bob):
    data = {
        'username': 'alice',
        'email': 'alice@example.com',
        'password': 'password',
        'short_name': 'Alice',
        'full_name': 'Alice Jones'
    }
    response = client_bob.post('/api/ui/v0/users/', data)

    assert response.status_code == 403
    assert response.json()[0]['code'] == 4004


def test_user_delete(client, user_bob):
    # Ensure we can access the user via API
    initial_response = client.get(f'/api/ui/v0/users/{user_bob.id}/')
    initial_response_data = initial_response.json()
    assert initial_response_data['username'] == user_bob.username

    # Delete the user
    response = client.delete(f'/api/ui/v0/users/{user_bob.id}/')
    # Ensure that the deletion happened
    assert response.status_code == 204
    assert User.objects.filter(id=user_bob.id).exists() is False


def test_user_delete_self(client_bob, user_bob):
    # Delete the user
    response = client_bob.delete(f'/api/ui/v0/users/{user_bob.id}/')
    # Ensure that the deletion happened
    assert response.status_code == 204
    assert User.objects.filter(id=user_bob.id).exists() is False


def test_user_delete_different_user(client_bob, user_alice):
    # Delete the user
    response = client_bob.delete(f'/api/ui/v0/users/{user_alice.id}/')
    assert response.status_code == 403
    assert response.json()[0]['code'] == 4004


def test_database_role_list(client, user_bob):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client.get('/api/ui/v0/database_roles/')
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
    SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.get('/api/ui/v0/schema_roles/')
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

    response = client.get(f'/api/ui/v0/database_roles/{database_role.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_detail(client, user_bob):
    role = 'editor'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.get(f'/api/ui/v0/schema_roles/{schema_role.id}/')
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

    response = client.put(f'/api/ui/v0/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_update(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.put(f'/api/ui/v0/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_partial_update(client, user_bob):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_partial_update(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_create(client, user_bob):
    role = 'editor'
    database = Database.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id}

    response = client.post('/api/ui/v0/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user_bob.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_create(client, user_bob):
    role = 'editor'
    schema = Schema.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.post('/api/ui/v0/schema_roles/', data)
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

    response = client.post('/api/ui/v0/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2081


def test_schema_role_create_with_incorrect_role(client, user_bob):
    role = 'nonsense'
    schema = Schema.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id}

    response = client.post('/api/ui/v0/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2081


def test_database_role_create_with_incorrect_database(client, user_bob):
    role = 'editor'
    database = Database.objects.order_by('-id')[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id + 1}

    response = client.post('/api/ui/v0/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2151


def test_schema_role_create_with_incorrect_schema(client, user_bob):
    role = 'editor'
    schema = Schema.objects.order_by('-id')[0]
    data = {'user': user_bob.id, 'role': role, 'schema': schema.id + 1}

    response = client.post('/api/ui/v0/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 400
    assert response_data[0]['code'] == 2151


def test_database_role_destroy(client, user_bob):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client.delete(f'/api/ui/v0/database_roles/{database_role.id}/')
    assert response.status_code == 204


def test_schema_role_destroy(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.delete(f'/api/ui/v0/schema_roles/{schema_role.id}/')
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
        response = client.post('/api/ui/v0/database_roles/', data)
        response_data = response.json()

        assert response.status_code == 500
        assert response_data[0]['code'] == 4201


def test_schema_role_create_multiple_roles_on_same_object(client, user_bob):
    role = 'manager'
    schema = Schema.objects.all()[0]
    SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'user': user_bob.id, 'role': 'editor', 'schema': schema.id}

    # The IntegrityError triggered here was causing issues with tearing down the
    # pytest user fixture. This answer suggested this solution:
    # https://stackoverflow.com/a/23326971/287415
    with transaction.atomic():
        response = client.post('/api/ui/v0/schema_roles/', data)
        response_data = response.json()

        assert response.status_code == 500
        assert response_data[0]['code'] == 4201
