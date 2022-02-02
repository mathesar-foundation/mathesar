def test_function_list_well_formed(client, test_db_model):
    database_name = test_db_model.name
    response = client.get(f'/api/v0/functions/?db_name={database_name}')
    json_db_functions = response.json()

    assert response.status_code == 200
    assert isinstance(json_db_functions, list)
    assert len(json_db_functions) > 0
    for json_db_function in json_db_functions:
        assert json_db_function.get('id') is not None
        hints = json_db_function.get('hints')
        assert hints is None or isinstance(hints, list)
