def test_db_type_list_well_formed(client, test_db_model):
    database_id = test_db_model.id
    response = client.get(f'/api/db/v0/connections/{database_id}/types/')
    assert response.status_code == 200
    json_db_types = response.json()
    assert isinstance(json_db_types, list)
    assert len(json_db_types) > 0
    for json_db_type in json_db_types:
        assert json_db_type.get('id') is not None
        hints = json_db_type.get('hints')
        assert hints is None or isinstance(hints, list)
