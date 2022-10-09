import pytest

from mathesar.models.base import Database, Schema
from mathesar.models.users import User, DatabaseRole, SchemaRole


@pytest.fixture
def user():
    user = User.objects.create(
        username='bob',
        email='bob@example.com',
        full_name='Bob Smith',
        short_name='Bob'
    )
    yield user
    user.delete()


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


def test_user_delete(client, user):
    # Ensure we can access the user via API
    initial_response = client.get(f'/api/ui/v0/users/{user.id}/')
    initial_response_data = initial_response.json()
    assert initial_response_data['username'] == user.username

    # Delete the user
    response = client.delete(f'/api/ui/v0/users/{user.id}/')
    # Ensure that the deletion happened
    assert response.status_code == 204
    assert User.objects.filter(id=user.id).exists() is False


def test_database_role_list(client, user):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user, database=database, role=role)

    response = client.get('/api/ui/v0/database_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == response_data['count']
    role_data = response_data['results'][0]
    assert 'id' in role_data
    assert role_data['user'] == user.id
    assert role_data['role'] == role
    assert role_data['database'] == database.id


def test_schema_role_list(client, user):
    role = 'manager'
    schema = Schema.objects.all()[0]
    SchemaRole.objects.create(user=user, schema=schema, role=role)

    response = client.get('/api/ui/v0/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == response_data['count']
    role_data = response_data['results'][0]
    assert 'id' in role_data
    assert role_data['user'] == user.id
    assert role_data['role'] == role
    assert role_data['schema'] == schema.id


def test_database_role_detail(client, user):
    role = 'editor'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user, database=database, role=role)

    response = client.get(f'/api/ui/v0/database_roles/{database_role.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert 'id' in response_data
    assert response_data['user'] == user.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_detail(client, user):
    role = 'editor'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user, schema=schema, role=role)

    response = client.get(f'/api/ui/v0/schema_roles/{schema_role.id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert 'id' in response_data
    assert response_data['user'] == user.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id


def test_database_role_update(client, user):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user, database=database, role=role)
    data = {'user': user.id, 'role': role, 'database': database.id}

    response = client.put(f'/api/ui/v0/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_update(client, user):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user, schema=schema, role=role)
    data = {'user': user.id, 'role': role, 'schema': schema.id}

    response = client.put(f'/api/ui/v0/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_partial_update(client, user):
    role = 'viewer'
    database = Database.objects.all()[0]
    database_role = DatabaseRole.objects.create(user=user, database=database, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/database_roles/{database_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_schema_role_partial_update(client, user):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user, schema=schema, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_create(client, user):
    role = 'editor'
    database = Database.objects.all()[0]
    data = {'user': user.id, 'role': role, 'database': database.id}

    response = client.post('/api/ui/v0/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_schema_role_create(client, user):
    role = 'editor'
    schema = Schema.objects.all()[0]
    data = {'user': user.id, 'role': role, 'schema': schema.id}

    response = client.post('/api/ui/v0/schema_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id
