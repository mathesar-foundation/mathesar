from mathesar.models.users import User


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
