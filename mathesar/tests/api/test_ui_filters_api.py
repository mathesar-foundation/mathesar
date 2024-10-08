from mathesar.models.deprecated import Connection
from mathesar.models.users import DatabaseRole


def test_filter_list_permissions(FUN_create_dj_db, get_uid, client_bob, client_alice, user_bob, user_alice):
    database = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=database, role='viewer')
    response = client_bob.get(f'/api/ui/v0/connections/{database.id}/filters/')
    assert response.status_code == 200

    response = client_alice.get(f'/api/ui/v0/connections/{database.id}/filters/')
    assert response.status_code == 404
