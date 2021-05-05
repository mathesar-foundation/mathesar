from mathesar.models import Schema


def check_schema_response(response_schema, schema, schema_name):
    assert response_schema['id'] == schema.id
    assert response_schema['name'] == schema_name
    assert response_schema['database'] == 'mathesar_db_test_database'
    assert len(response_schema['tables']) == 1
    response_table = response_schema['tables'][0]
    assert 'id' in response_table
    response_table_id = response_table['id']
    assert 'name' in response_table
    assert response_table['url'].startswith('http')
    assert response_table['url'].endswith(f'/api/v0/tables/{response_table_id}/')


def test_schema_list(create_table, client):
    """
    Desired format:
    {
        "count": 1,
        "results": [
            {
                "id": 1,
                "name": "Patents",
                "database": "mathesar_tables",
                "tables": [
                    {
                        "id": 1,
                        "name": "Fairfax County",
                        "url": "http://testserver/api/v0/tables/1/",
                    }

                ]
            }
        ]
    }
    """
    create_table('NASA Schema List')

    schema = Schema.objects.get()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schema = response_data['results'][0]
    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    check_schema_response(response_schema, schema, 'Patents')


def test_schema_detail(create_table, client):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    create_table('NASA Schema Detail')

    schema = Schema.objects.get()
    response = client.get(f'/api/v0/schemas/{schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(response_schema, schema, 'Patents')


def test_schema_404(create_table, client):
    response = client.get('/api/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'
