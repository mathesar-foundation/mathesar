def _verify_primary_and_unique_constraints(response):
    response_data = response.json()
    constraints_data = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert set(['unique', 'primary']) == set([constraint_data['type'] for constraint_data in constraints_data])


def _verify_unique_constraint(constraint_data, columns, name):
    assert constraint_data['columns'] == columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'unique'
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def test_default_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 0'
    table = create_table(table_name)
    constraint_column_id = table.columns.all()[0].id

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    constraint_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert constraint_data['columns'] == [constraint_column_id]
    assert 'id' in constraint_data and type(constraint_data['id']) == int
    assert constraint_data['name'] == 'NASA Constraint List 0_pkey'
    assert constraint_data['type'] == 'primary'


def test_multiple_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 1'
    table = create_table(table_name)
    constraint_column = table.columns.all()[3]
    table.add_constraint('unique', [constraint_column])

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, [constraint_column.id], 'NASA Constraint List 1_Case Number_key')


def test_multiple_column_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 2'
    table = create_table(table_name)
    columns = table.columns.all()
    constraint_column_1 = columns[2]
    constraint_column_2 = columns[3]
    constraint_column_id_list = [constraint_column_1.id, constraint_column_2.id]
    table.add_constraint('unique', constraint_column_id_list)

    response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, constraint_column_id_list, 'NASA Constraint List 2_Center_key')


def test_retrieve_constraint(create_table, client):
    table_name = 'NASA Constraint List 3'
    table = create_table(table_name)
    constraint_column = table.columns.all()[3]
    constraint_column_names = [constraint_column.name]
    table.add_constraint('unique', constraint_column_names)
    list_response = client.get(f'/api/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.get(f'/api/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 200
    _verify_unique_constraint(response.json(), constraint_column_names, 'NASA Constraint List 3_Case Number_key')


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
    constraint_column_id = table.columns.all()[3].id
    data = {
        'type': 'unique',
        'columns': [constraint_column_id]
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), [constraint_column_id], 'NASA Constraint List 5_Case Number_key')


def test_create_unique_constraint_with_name_specified(create_table, client):
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

    table.add_constraint('unique', ['Case Number'])
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


def test_create_unique_constraint_with_duplicate_name(create_table, client):
    table_name = 'NASA Constraint List 8'
    table = create_table(table_name)

    table.add_constraint('unique', ['Case Number'])
    data = {
        'type': 'unique',
        'columns': ['Case Number', 'Center']
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 400
    assert response.json() == ['Relation with the same name already exists']


def test_create_unique_constraint_for_non_unique_column(create_table, client):
    table_name = 'NASA Constraint List 9'
    table = create_table(table_name)

    data = {
        'type': 'unique',
        'columns': ['Center']
    }
    response = client.post(f'/api/v0/tables/{table.id}/constraints/', data=data)
    assert response.status_code == 400
    assert response.json() == ['This column has non-unique values so a unique constraint cannot be set']


def test_drop_nonexistent_constraint(create_table, client):
    table_name = 'NASA Constraint List 10'
    table = create_table(table_name)

    response = client.delete(f'/api/v0/tables/{table.id}/constraints/345/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


def test_drop_nonexistent_table(create_table, client):
    response = client.delete('/api/v0/tables/9387489/constraints/4234/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'
