def test_database_key_list(client, test_db_name):
    """
    Desired format:
    ['mathesar_tables']
    """
    response = client.get('/api/v0/database_keys/')
    response_data = response.json()
    assert response.status_code == 200
    assert len(response_data) == 1
    assert response_data[0] == test_db_name
