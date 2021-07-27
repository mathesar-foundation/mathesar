def test_default_constraint_list(create_table, client):
    table_name = 'NASA Constraint List'
    table = create_table(table_name)

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    constraint_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert constraint_data["columns"] == ["mathesar_id"]
    assert constraint_data["id"] == "NASA Constraint List_pkey"
    assert constraint_data["name"] == "NASA Constraint List_pkey"
    assert constraint_data["type"] == "primary"
