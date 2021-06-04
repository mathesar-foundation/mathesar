import os
import pytest

from django.core.files import File

from mathesar.models import Table
from mathesar.models import DataFile
from mathesar.utils.schemas import create_schema_and_object


@pytest.fixture
def schema(test_db_name):
    return create_schema_and_object('table_tests', test_db_name)


@pytest.fixture
def data_file(csv_filename, schema):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file), schema=schema)
    return data_file


def check_table_response(response_table, table, table_name):
    assert response_table['id'] == table.id
    assert response_table['name'] == table_name
    assert '/api/v0/schemas/' in response_table['schema']
    assert 'created_at' in response_table
    assert 'updated_at' in response_table
    assert len(response_table['columns']) == len(table.sa_column_names)
    for column in response_table['columns']:
        assert column['name'] in table.sa_column_names
        assert 'type' in column
    assert response_table['records'].startswith('http')
    assert '/api/v0/tables/' in response_table['records']
    assert response_table['records'].endswith('/records/')


def test_table_list(create_table, client):
    """
    Desired format:
    {
        "count": 1,
        "results": [
            {
                "id": 1,
                "name": "NASA Table List",
                "schema": "http://testserver/api/v0/schemas/1/",
                "created_at": "2021-04-27T18:43:41.201851Z",
                "updated_at": "2021-04-27T18:43:41.201898Z",
                "columns": [
                    {
                        "name": "mathesar_id",
                        "type": "INTEGER"
                    },
                    {
                        "name": "Center",
                        "type": "VARCHAR"
                    },
                    # etc.
                ],
                "records": "http://testserver/api/v0/tables/3/records/"
            }
        ]
    }
    """
    table_name = 'NASA Table List'
    create_table(table_name)

    table = Table.objects.get(name=table_name)
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    response_table = None
    for table_data in response_data['results']:
        if table_data['name'] == table_name:
            response_table = table_data
            break
    assert response.status_code == 200
    assert response_data['count'] >= 1
    assert len(response_data['results']) >= 1
    check_table_response(response_table, table, table_name)


def test_table_detail(create_table, client):
    """
    Desired format:
    One item in the results list in the table list view, see above.
    """
    table_name = 'NASA Table Detail'
    create_table(table_name)

    table = Table.objects.get(name=table_name)
    response = client.get(f'/api/v0/tables/{table.id}/')
    response_table = response.json()
    assert response.status_code == 200
    check_table_response(response_table, table, table_name)


def test_table_create_from_datafile(client, data_file, schema):
    num_tables = Table.objects.count()
    table_name = 'test_table'
    body = {
        'data_file': data_file.id,
        'name': table_name,
        'schema': schema.id
    }
    response = client.post('/api/v0/tables/', body)
    response_table = response.json()
    print(response_table)
    table = Table.objects.get(id=response_table['id'])

    assert response.status_code == 201
    assert Table.objects.count() == num_tables + 1
    check_table_response(response_table, table, table_name)


def test_table_404(client):
    response = client.get('/api/v0/tables/3000/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


def test_table_create_from_datafile_404(client):
    response = client.post('/api/v0/tables/', {'data_file_pk': -999})
    assert response.status_code == 400
    assert response.json()['data_file_pk'] == 'Data file not found'
