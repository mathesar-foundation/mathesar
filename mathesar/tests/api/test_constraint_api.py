import json

from sqlalchemy import Column, ForeignKey, Integer, MetaData, Table as SATable

from db.tables.operations.select import get_oid_from_table
from mathesar import models
from mathesar.api.exceptions.error_codes import ErrorCodes


def _verify_primary_and_unique_constraints(response):
    response_data = response.json()
    constraints_data = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert set(['unique', 'primary']) == set([constraint_data['type'] for constraint_data in constraints_data])


def _verify_foreign_key_constraint(constraint_data, columns, name, referent_table, referent_columns):
    assert constraint_data['referent']['table'] == referent_table
    assert constraint_data['columns'] == columns
    assert constraint_data['referent']['columns'] == referent_columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'foreignkey'
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def _verify_unique_constraint(constraint_data, columns, name):
    assert constraint_data['columns'] == columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'unique'
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def _get_columns_by_name(table, name_list):
    columns_by_name_dict = {
        col.name: col for col in table.columns.all() if col.name in name_list
    }
    return [columns_by_name_dict[col_name] for col_name in name_list]


def test_default_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 0'
    table = create_table(table_name)
    constraint_column_id = _get_columns_by_name(table, ['id'])[0].id

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
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
    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
    table.add_constraint('unique', [constraint_column])

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, [constraint_column.id], 'NASA Constraint List 1_Case Number_key')


def test_existing_foreign_key_constraint_list(patent_schema, client):
    engine = patent_schema._sa_engine
    referent_col_name = "referred_col"
    metadata = MetaData(bind=engine, schema=patent_schema.name)
    db_table = SATable(
        "referent",
        metadata,
        Column(referent_col_name, Integer, primary_key=True),
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    ref_table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    fk_column_name = "fk_col"
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column(fk_column_name, Integer, ForeignKey("referent.referred_col"), nullable=False),
    ]
    db_table = SATable(
        "referrer",
        metadata,
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    print(response_data)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'foreignkey':
            _verify_foreign_key_constraint(
                constraint_data,
                [referent_col_name],
                'Patents_Center_fkey',
                ref_table.id,
                [fk_column_name]
            )


def test_multiple_column_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 2'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
    constraint_column_id_list = [constraint_columns[0].id, constraint_columns[1].id]
    table.add_constraint('unique', [constraint_columns[0], constraint_columns[1]])

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, constraint_column_id_list, 'NASA Constraint List 2_Center_key')


def test_retrieve_constraint(create_table, client):
    table_name = 'NASA Constraint List 3'
    table = create_table(table_name)
    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
    constraint_column_id_list = [constraint_column.id]
    table.add_constraint('unique', [constraint_column])
    list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 200
    _verify_unique_constraint(response.json(), constraint_column_id_list, 'NASA Constraint List 3_Case Number_key')


def test_create_multiple_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 4'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
    constraint_column_1 = constraint_columns[0]
    constraint_column_2 = constraint_columns[1]
    constraint_column_id_list = [constraint_column_1.id, constraint_column_2.id]
    data = {
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), constraint_column_id_list, 'NASA Constraint List 4_Center_key')


def test_create_single_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 5'
    table = create_table(table_name)
    constraint_column_id = _get_columns_by_name(table, ['Case Number'])[0].id
    data = {
        'type': 'unique',
        'columns': [constraint_column_id]
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), [constraint_column_id], 'NASA Constraint List 5_Case Number_key')


def test_create_unique_constraint_with_name_specified(create_table, client):
    table_name = 'NASA Constraint List 6'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Case Number'])
    constraint_column_id_list = [constraint_columns[0].id]
    data = {
        'name': 'awesome_constraint',
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), constraint_column_id_list, 'awesome_constraint')


def test_drop_constraint(create_table, client):
    table_name = 'NASA Constraint List 7'
    table = create_table(table_name)

    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
    table.add_constraint('unique', [constraint_column])
    list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 204
    new_list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    assert new_list_response.json()['count'] == 1


def test_create_unique_constraint_with_duplicate_name(create_table, client):
    table_name = 'NASA Constraint List 8'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
    constraint_column_id_list = [constraint_columns[0].id, constraint_columns[1].id]
    table.add_constraint('unique', [constraint_columns[0], constraint_columns[1]])
    data = {
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400
    response_body = response.json()[0]
    assert response_body['message'] == 'Relation with the same name already exists'
    assert response_body['code'] == ErrorCodes.DuplicateTableError.value


def test_create_unique_constraint_for_non_unique_column(create_table, client):
    table_name = 'NASA Constraint List 9'
    table = create_table(table_name)
    constraint_column = _get_columns_by_name(table, ['Center'])[0]
    data = {
        'type': 'unique',
        'columns': [constraint_column.id]
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400
    response_body = response.json()[0]
    assert response_body['message'] == 'This column has non-unique values so a unique constraint cannot be set'
    assert response_body['code'] == ErrorCodes.UniqueViolation.value


def test_drop_nonexistent_constraint(create_table, client):
    table_name = 'NASA Constraint List 10'
    table = create_table(table_name)

    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/345/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value


def test_drop_nonexistent_table(create_table, client):
    response = client.delete('/api/db/v0/tables/9387489/constraints/4234/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value
