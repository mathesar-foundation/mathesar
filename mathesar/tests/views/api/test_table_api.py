from unittest.mock import patch
import pytest

from django.core.cache import cache
from django.core.files import File
from sqlalchemy import text

from mathesar.models import Table
from mathesar.models import DataFile
from mathesar.utils.schemas import create_schema_and_object
from mathesar.views import api
from mathesar.imports.csv import legacy_create_table_from_csv


@pytest.fixture
def schema(test_db_name):
    return create_schema_and_object('table_tests', test_db_name)


@pytest.fixture
def data_file(csv_filename):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


def check_table_response(response_table, table, table_name):
    assert response_table['id'] == table.id
    assert response_table['name'] == table_name
    assert response_table['schema'] == table.schema.id
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
    table = create_table(table_name)

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


def test_table_list_filter(create_table, client):
    tables = {
        'Nasa Table List Filter': create_table('Nasa Table List Filter'),
        'Filler Table 1': create_table('Filler Table 1'),
        'Filler Table 2': create_table('Filler Table 2')
    }

    filter_tables = ['Nasa Table List Filter', 'Filler Table 1']
    query_str = ','.join(filter_tables)

    response = client.get(f'/api/v0/tables/?name={query_str}')
    response_data = response.json()
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2

    response_tables = {res['name']: res for res in response_data['results']}
    for table_name in filter_tables:
        assert table_name in response_tables
        table = tables[table_name]
        response_table = response_tables[table_name]
        check_table_response(response_table, table, table_name)


def test_table_detail(create_table, client):
    """
    Desired format:
    One item in the results list in the table list view, see above.
    """
    table_name = 'NASA Table Detail'
    table = create_table(table_name)

    response = client.get(f'/api/v0/tables/{table.id}/')
    response_table = response.json()
    assert response.status_code == 200
    check_table_response(response_table, table, table_name)


def test_table_type_suggestion(client, test_db_name):
    table_name = 'Type Inference Table'
    file = 'mathesar/tests/data/type_inference.csv'
    schema = 'type_inference'
    EXPECTED_TYPES = {
        'col_1': 'numeric',
        'col_2': 'boolean',
        'col_3': 'boolean',
        'col_4': 'string',
        'col_5': 'string',
        'col_6': 'numeric'
    }

    with open(file, 'rb') as csv_file:
        table = legacy_create_table_from_csv(
            name=table_name,
            schema=schema,
            database_key=test_db_name,
            csv_file=csv_file
        )

    response = client.get(f'/api/v0/tables/{table.id}/type_suggestions/')
    response_table = response.json()
    print(response_table)
    assert response.status_code == 200
    assert response_table == EXPECTED_TYPES


def test_table_create_from_datafile(client, data_file, schema):
    num_tables = Table.objects.count()
    table_name = 'test_table'
    body = {
        'data_files': [data_file.id],
        'name': table_name,
        'schema': schema.id,
    }
    response = client.post('/api/v0/tables/', body)
    response_table = response.json()
    table = Table.objects.get(id=response_table['id'])
    data_file.refresh_from_db()
    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)

    assert response.status_code == 201
    assert Table.objects.count() == num_tables + 1
    assert data_file.table_imported_to.id == table.id
    assert table.get_records()[0] == first_row
    check_table_response(response_table, table, table_name)


def test_table_404(client):
    response = client.get('/api/v0/tables/3000/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


def test_table_create_from_datafile_404(client):
    body = {
        'data_files': -999,
        'name': 'test_table',
        'schema': -999,
    }
    response = client.post('/api/v0/tables/', body)
    response_table = response.json()
    assert response.status_code == 400
    assert 'object does not exist' in response_table['schema'][0]
    assert 'object does not exist' in response_table['data_files'][0]


def test_table_update(client, create_table):
    table = create_table('update_table_test')
    response = client.put(f'/api/v0/tables/{table.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_data_file_partial_update(client, create_table):
    table = create_table('partial_update_table_test')
    response = client.patch(f'/api/v0/tables/{table.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PATCH" not allowed.'


def test_data_file_delete(client, create_table):
    table = create_table('delete_table_test')
    response = client.delete(f'/api/v0/tables/{table.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "DELETE" not allowed.'


def test_table_get_with_reflect_new(client, table_for_reflection):
    _, table_name, _ = table_for_reflection
    cache.clear()
    response = client.get('/api/v0/tables/')
    # The table number should only change after the GET request
    response_data = response.json()
    actual_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(actual_created) == 1
    created_table = actual_created[0]
    assert created_table['name'] == table_name
    created_columns = created_table['columns']
    assert created_columns == [
        {'name': 'id', 'type': 'INTEGER'}, {'name': 'name', 'type': 'VARCHAR'}
    ]


def test_table_get_with_reflect_column_change(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    orig_id = orig_created[0]['id']
    new_column_name = 'new_name'
    with engine.begin() as conn:
        conn.execute(
            text(f'ALTER TABLE {schema_name}.{table_name} RENAME COLUMN name TO {new_column_name};')
        )
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    altered_table = [
        table for table in response_data['results'] if table['name'] == table_name
    ][0]
    new_columns = altered_table['columns']
    assert altered_table['id'] == orig_id
    assert new_columns == [
        {'name': 'id', 'type': 'INTEGER'},
        {'name': new_column_name, 'type': 'VARCHAR'}
    ]


def test_table_get_with_reflect_name_change(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    orig_id = orig_created[0]['id']
    new_table_name = 'super_new_table_name'
    with engine.begin() as conn:
        conn.execute(
            text(
                f'ALTER TABLE {schema_name}.{table_name} RENAME TO {new_table_name};'
            )
        )
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    orig_created_2 = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(orig_created_2) == 0
    modified = [
        table for table in response_data['results'] if table['name'] == new_table_name
    ]
    modified_id = modified[0]['id']
    assert len(modified) == 1
    assert orig_id == modified_id


def test_table_get_with_reflect_delete(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(orig_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE {schema_name}.{table_name};'))
    cache.clear()
    response = client.get('/api/v0/tables/')
    response_data = response.json()
    new_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(new_created) == 0


def test_table_viewset_sets_cache(client):
    cache.delete(api.DB_REFLECTION_KEY)
    assert not cache.get(api.DB_REFLECTION_KEY)
    client.get('/api/v0/schemas/')
    assert cache.get(api.DB_REFLECTION_KEY)


def test_table_viewset_checks_cache(client):
    cache.delete(api.DB_REFLECTION_KEY)
    with patch.object(api, 'reflect_tables_from_schema') as mock_reflect:
        client.get('/api/v0/tables/')
    mock_reflect.assert_called()
