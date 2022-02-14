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
