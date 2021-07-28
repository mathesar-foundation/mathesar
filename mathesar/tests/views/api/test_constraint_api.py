def _verify_primary_and_unique_constraints(response):
    response_data = response.json()
    constraints_data = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert set(['unique', 'primary']) == set([constraint_data['type'] for constraint_data in constraints_data])


def _verify_unique_constraint(constraint_data, columns, name):
    assert constraint_data['columns'] == columns
    assert constraint_data['id'] == name
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'unique'


def test_default_constraint_list(create_table, client):
    table_name = 'NASA Constraint List'
    table = create_table(table_name)

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    constraint_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert constraint_data['columns'] == ['mathesar_id']
    assert constraint_data['id'] == 'NASA Constraint List_pkey'
    assert constraint_data['name'] == 'NASA Constraint List_pkey'
    assert constraint_data['type'] == 'primary'


def test_multiple_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 2'
    table = create_table(table_name)
    table.add_constraint({'type': 'unique', 'columns': ['Case Number']})

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, ['Case Number'], 'NASA Constraint List 2_Case Number_key')


def test_multiple_column_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 3'
    table = create_table(table_name)
    table.add_constraint({'type': 'unique', 'columns': ['Center', 'Case Number']})

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, ['Center', 'Case Number'], 'NASA Constraint List 3_Center_key')


def test_create_multiple_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 4'
    table = create_table(table_name)

    data = {
        'type': 'unique',
        'columns': ['Center', 'Case Number']
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), ['Center', 'Case Number'], 'NASA Constraint List 4_Center_key')


def test_create_single_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 5'
    table = create_table(table_name)

    data = {
        'type': 'unique',
        'columns': ['Case Number']
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), ['Case Number'], 'NASA Constraint List 5_Case Number_key')


def test_create_single_column_unique_constraint_with_name(create_table, client):
    table_name = 'NASA Constraint List 6'
    table = create_table(table_name)

    data = {
        'name': 'awesome_constraint',
        'type': 'unique',
        'columns': ['Case Number']
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), ['Case Number'], 'awesome_constraint')


def test_drop_constraint(create_table, client):
    table_name = 'NASA Constraint List 7'
    table = create_table(table_name)

    data = {
        'type': 'unique',
        'columns': ['Case Number']
    }
    table.add_constraint(data)
    list_response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.delete(f'/api/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 204
    new_list_response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    assert new_list_response.json()['count'] == 1
