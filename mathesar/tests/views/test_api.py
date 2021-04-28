import pytest
from rest_framework.test import APIClient

from mathesar.models import Table
from mathesar.imports.csv import create_table_from_csv


@pytest.fixture
def table_setup(engine, csv_filename):
    if Table.objects.count() < 1:
        with open(csv_filename, 'rb') as csv_file:
            table = create_table_from_csv(
                name='Fairfax County',
                schema='Libraries',
                database_key='mathesar_db_test_database',
                csv_file=csv_file
            )
            return table


@pytest.fixture
def client():
    return APIClient()


def test_schema_list(table_setup, client):
    """
    Desired format.
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
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schema = response_data['results'][0]
    response_table = response_schema['tables'][0]
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    assert response_schema['id'] == 1
    assert response_schema['name'] == 'Libraries'
    assert response_schema['database'] == 'mathesar_db_test_database'
    assert len(response_schema['tables']) == 1
    assert response_table.startswith('http')
    assert response_table.endswith('/api/v0/tables/1/')
