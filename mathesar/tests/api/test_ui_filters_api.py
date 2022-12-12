from mathesar.models.base import Database
from mathesar.filters.base import get_available_filters
from mathesar.models.users import DatabaseRole


def test_filter_list(client, test_db_name):
    database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{database.id}/filters/')
    response_data = response.json()
    assert response.status_code == 200
    for available_filter in response_data:
        assert all([key in available_filter for key in ['id', 'name', 'parameters']])
    assert len(response_data) == len(get_available_filters(database._sa_engine))


def test_filter_list_permissions(FUN_create_dj_db, get_uid, client_bob, client_alice, user_bob, user_alice):
    database = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=database, role='viewer')
    response = client_bob.get(f'/api/ui/v0/databases/{database.id}/filters/')
    assert response.status_code == 200

    response = client_alice.get(f'/api/ui/v0/databases/{database.id}/filters/')
    assert response.status_code == 404
