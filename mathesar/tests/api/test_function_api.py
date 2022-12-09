from mathesar.models.users import DatabaseRole


def test_function_list_well_formed(client, test_db_model):
    database_id = test_db_model.id
    response = client.get(f'/api/db/v0/databases/{database_id}/functions/')
    assert response.status_code == 200
    json_db_functions = response.json()
    assert isinstance(json_db_functions, list)
    assert len(json_db_functions) > 0
    for json_db_function in json_db_functions:
        assert json_db_function.get('id') is not None
        hints = json_db_function.get('hints')
        assert hints is None or isinstance(hints, list)


def test_filter_list_permissions(FUN_create_dj_db, get_uid, client_bob, client_alice, user_bob, user_alice):
    database = FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=database, role='viewer')
    response = client_bob.get(f'/api/db/v0/databases/{database.id}/functions/')
    response_data = response.json()
    assert response.status_code == 200
    assert len(response_data) == len(database.supported_ui_types)

    response = client_alice.get(f'/api/db/v0/databases/{database.id}/functions/')
    assert response.status_code == 404
