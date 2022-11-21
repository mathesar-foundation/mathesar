from django.db import transaction

from db.schemas.utils import get_schema_oid_from_name
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


def test_database_role_list_user_without_view_permission(client_bob, user_alice):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_alice, database=database, role=role)

    response = client_bob.get('/api/ui/v0/database_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 0


def test_db_role_list_with_roles_on_multiple_database(FUN_create_dj_db, client_bob, user_bob, get_uid):
    FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    databases = Database.objects.all()
    database_with_viewer_access = databases[0]
    DatabaseRole.objects.create(user=user_bob, database=database_with_viewer_access, role='viewer')
    database_with_manager_access = databases[1]
    DatabaseRole.objects.create(user=user_bob, database=database_with_manager_access, role='manager')

    response = client_bob.get('/api/ui/v0/database_roles/')

    assert response.status_code == 200


def test_database_role_list_user_with_view_permission(client_bob, user_alice, user_bob):
    role = 'manager'
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_alice, database=database, role=role)
    DatabaseRole.objects.create(user=user_bob, database=database, role=role)

    response = client_bob.get('/api/ui/v0/database_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 2


def test_database_role_list_superuser(client, user_bob):
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
    role = 'viewer'
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


def test_schema_role_list_database_viewer(client, user_bob, user_alice):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=schema.database, role=role)
    SchemaRole.objects.create(user=user_alice, schema=schema, role='editor')
    response = client.get('/api/ui/v0/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1


def test_schema_role_list_schema_viewer(create_schema, client_bob, user_bob, user_alice, get_uid):
    different_schema = create_schema(get_uid())
    SchemaRole.objects.create(user=user_bob, schema=different_schema, role='viewer')
    SchemaRole.objects.create(user=user_alice, schema=different_schema, role='editor')
    response = client_bob.get('/api/ui/v0/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 2


def test_schema_role_list_no_roles(create_schema, client_bob, user_alice, get_uid):
    schema = Schema.objects.all()[0]
    different_schema = create_schema(get_uid())
    DatabaseRole.objects.create(user=user_alice, database=schema.database, role='viewer')
    SchemaRole.objects.create(user=user_alice, schema=different_schema, role='manager')
    response = client_bob.get('/api/ui/v0/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 0


def test_schema_role_list_with_roles_on_multiple_database(
        FUN_create_dj_db,
        create_schema,
        client_bob,
        user_alice,
        get_uid
):
    FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    schema = Schema.objects.all()[0]
    different_schema = create_schema(get_uid())
    DatabaseRole.objects.create(user=user_alice, database=schema.database, role='viewer')
    SchemaRole.objects.create(user=user_alice, schema=different_schema, role='manager')
    response = client_bob.get('/api/ui/v0/schema_roles/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 0


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
    role = 'manager'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)
    data = {'role': 'editor'}

    response = client.patch(f'/api/ui/v0/schema_roles/{schema_role.id}/', data)
    response_data = response.json()

    assert response.status_code == 405
    assert response_data[0]['code'] == 4006


def test_database_role_create_by_superuser(client, user_bob):
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


def test_database_role_create_by_manager(client_bob, user_bob, user_alice):
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role='manager')

    role = 'viewer'
    data = {'user': user_alice.id, 'role': role, 'database': database.id}

    response = client_bob.post('/api/ui/v0/database_roles/', data)
    response_data = response.json()

    assert response.status_code == 201
    assert 'id' in response_data
    assert response_data['user'] == user_alice.id
    assert response_data['role'] == role
    assert response_data['database'] == database.id


def test_db_role_create_with_roles_on_multiple_database(FUN_create_dj_db, client_bob, user_bob, user_alice, get_uid):
    FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    databases = Database.objects.all()
    database_with_viewer_access = databases[0]
    DatabaseRole.objects.create(user=user_bob, database=database_with_viewer_access, role='viewer')
    database_with_manager_access = databases[1]
    DatabaseRole.objects.create(user=user_bob, database=database_with_manager_access, role='manager')

    role = 'viewer'
    data = {'user': user_alice.id, 'role': role, 'database': database_with_viewer_access.id}

    response = client_bob.post('/api/ui/v0/database_roles/', data)

    assert response.status_code == 400


def test_database_role_create_non_superuser(client_bob, user_bob):
    role = 'editor'
    database = Database.objects.all()[0]
    data = {'user': user_bob.id, 'role': role, 'database': database.id}

    response = client_bob.post('/api/ui/v0/database_roles/', data)

    assert response.status_code == 400
    assert response.json()[0]['code'] == 2151


def test_schema_role_create_by_superuser(client, user_bob):
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


def test_schema_role_create_no_roles(create_schema, client_bob, user_alice, get_uid):
    role = 'manager'
    schema = create_schema(get_uid())
    data = {'user': user_alice.id, 'role': role, 'schema': schema.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 400


def test_schema_role_create_without_permissible_role(create_schema, client_bob, user_bob, user_alice, get_uid):
    schema = create_schema(get_uid())
    SchemaRole.objects.create(user=user_bob, schema=schema, role='editor')
    role = 'editor'
    data = {'user': user_alice.id, 'role': role, 'schema': schema.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 400


def test_schema_role_create_by_schema_manager(create_schema, client_bob, user_bob, user_alice, get_uid):
    role = 'manager'
    schema = create_schema(get_uid())
    SchemaRole.objects.create(user=user_bob, schema=schema, role='manager')
    data = {'user': user_alice.id, 'role': role, 'schema': schema.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 201
    response_data = response.json()
    assert response_data['user'] == user_alice.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id


def test_schema_role_create_by_db_manager(create_schema, client_bob, user_bob, user_alice, get_uid):
    role = 'manager'
    schema = create_schema(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=schema.database, role='manager')
    data = {'user': user_alice.id, 'role': role, 'schema': schema.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 201
    response_data = response.json()
    assert response_data['user'] == user_alice.id
    assert response_data['role'] == role
    assert response_data['schema'] == schema.id


def test_schema_role_create_with_multiple_database(
        FUN_create_dj_db,
        MOD_engine_cache,
        create_db_schema,
        client_bob,
        user_bob,
        user_alice,
        get_uid
):
    schema_params = [
        ("schema_1", "database_1"), ("schema_2", "database_2"),
        ("schema_3", "database_3"), ("schema_1", "database_3")
    ]

    dbs_to_create = set(param[1] for param in schema_params)

    for db_name in dbs_to_create:
        FUN_create_dj_db(db_name)

    for schema_name, db_name in schema_params:
        engine = MOD_engine_cache(db_name)
        create_db_schema(schema_name, engine)

    schemas = {
        schema_param: Schema.objects.get(
            oid=get_schema_oid_from_name(
                schema_param[0],
                MOD_engine_cache(schema_param[1])
            ),
        )
        for schema_param in schema_params
    }
    db1_schema_with_manager_role = schemas[schema_params[0]]
    db2_schema_with_no_schema_role_but_db_manager = schemas[schema_params[1]]
    DatabaseRole.objects.create(
        user=user_bob,
        database=db2_schema_with_no_schema_role_but_db_manager.database,
        role='manager'
    )
    db3_schema_with_no_role = schemas[schema_params[2]]
    db3_schema_with_editor_role = schemas[schema_params[2]]
    SchemaRole.objects.create(user=user_bob, schema=db1_schema_with_manager_role, role='manager')
    SchemaRole.objects.create(user=user_bob, schema=db3_schema_with_editor_role, role='editor')
    data = {'user': user_alice.id, 'role': 'manager', 'schema': db1_schema_with_manager_role.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 201
    data = {'user': user_alice.id, 'role': 'manager', 'schema': db3_schema_with_no_role.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 400
    data = {'user': user_alice.id, 'role': 'manager', 'schema': db3_schema_with_editor_role.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 400
    data = {'user': user_alice.id, 'role': 'manager', 'schema': db2_schema_with_no_schema_role_but_db_manager.id}
    response = client_bob.post('/api/ui/v0/schema_roles/', data=data)
    assert response.status_code == 201


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


def test_database_role_destroy_by_manager(client_bob, user_bob, user_alice):
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role='manager')

    role = 'viewer'
    database_role = DatabaseRole.objects.create(user=user_alice, database=database, role=role)

    response = client_bob.delete(f'/api/ui/v0/database_roles/{database_role.id}/')
    assert response.status_code == 204


def test_database_role_destroy_by_non_manager(client_bob, user_bob, user_alice):
    database = Database.objects.all()[0]
    DatabaseRole.objects.create(user=user_bob, database=database, role='viewer')

    role = 'viewer'
    database_role = DatabaseRole.objects.create(user=user_alice, database=database, role=role)

    response = client_bob.delete(f'/api/ui/v0/database_roles/{database_role.id}/')
    assert response.status_code == 403


def test_database_role_destroy_by_user_without_role(client_bob, user_alice):
    database = Database.objects.all()[0]

    role = 'viewer'
    database_role = DatabaseRole.objects.create(user=user_alice, database=database, role=role)

    response = client_bob.delete(f'/api/ui/v0/database_roles/{database_role.id}/')
    assert response.status_code == 404


def test_schema_role_destroy_by_superuser(client, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client.delete(f'/api/ui/v0/schema_roles/{schema_role.id}/')
    assert response.status_code == 204


def test_schema_role_destroy_by_manager(client_bob, user_bob):
    role = 'manager'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client_bob.delete(f'/api/ui/v0/schema_roles/{schema_role.id}/')
    assert response.status_code == 204


def test_schema_role_destroy_by_non_manager(client_bob, user_bob):
    role = 'viewer'
    schema = Schema.objects.all()[0]
    schema_role = SchemaRole.objects.create(user=user_bob, schema=schema, role=role)

    response = client_bob.delete(f'/api/ui/v0/schema_roles/{schema_role.id}/')
    assert response.status_code == 403


def test_schema_role_destroy_by_db_manager(client_bob, user_bob, user_alice):
    schema = Schema.objects.all()[0]
    database = schema.database
    DatabaseRole.objects.create(user=user_bob, database=database, role='manager')

    schema_role = SchemaRole.objects.create(user=user_alice, schema=schema, role='viewer')

    response = client_bob.delete(f'/api/ui/v0/schema_roles/{schema_role.id}/')
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
