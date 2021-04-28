import pytest
from rest_framework.test import APIClient

from mathesar.models import Schema
from mathesar.imports.csv import create_table_from_csv


@pytest.fixture
def client():
    return APIClient()


def test_schema_list(engine, csv_filename, client):
    """
    Desired format:
    {
        "count": 1,
        "results": [
            {
                "id": 1,
                "name": "Libraries",
                "database": "mathesar_tables",
                "tables": [
                    "http://testserver/api/v0/tables/1/",
                ]
            }
        ]
    }
    """
    with open(csv_filename, 'rb') as csv_file:
        create_table_from_csv(
            name='Fairfax County 1',
            schema='Libraries',
            database_key='mathesar_db_test_database',
            csv_file=csv_file
        )
    schema = Schema.objects.get()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schema = response_data['results'][0]
    response_table = response_schema['tables'][0]
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    assert response_schema['id'] == schema.id
    assert response_schema['name'] == 'Libraries'
    assert response_schema['database'] == 'mathesar_db_test_database'
    assert len(response_schema['tables']) == 1
    assert response_table.startswith('http')
    assert '/api/v0/tables/' in response_table


def test_schema_detail(engine, csv_filename, client):
    """
    Desired format:
    {
        "id": 1,
        "name": "Libraries",
        "database": "mathesar_tables",
        "tables": [
            "http://testserver/api/v0/tables/1/",
        ]
    }
    """
    with open(csv_filename, 'rb') as csv_file:
        create_table_from_csv(
            name='Fairfax County 2',
            schema='Libraries',
            database_key='mathesar_db_test_database',
            csv_file=csv_file
        )
    schema = Schema.objects.get()
    response = client.get(f'/api/v0/schemas/{schema.id}/')
    response_data = response.json()
    response_table = response_data['tables'][0]
    assert response.status_code == 200
    assert response_data['id'] == schema.id
    assert response_data['name'] == schema.name
    assert response_data['database'] == schema.database
    assert len(response_data['tables']) == 1
    assert response_table.startswith('http')
    assert '/api/v0/tables/' in response_table
