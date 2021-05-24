from db.schemas import get_mathesar_schemas
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Schema
from mathesar.utils.schemas import create_schema_and_object


def check_schema_response(response_schema, schema, schema_name, test_db_name, len_tables=1):
    assert response_schema['id'] == schema.id
    assert response_schema['name'] == schema_name
    assert response_schema['database'] == test_db_name
    assert len(response_schema['tables']) == len_tables
    if len_tables > 0:
        response_table = response_schema['tables'][0]
        assert 'id' in response_table
        response_table_id = response_table['id']
        assert 'name' in response_table
        assert response_table['url'].startswith('http')
        assert response_table['url'].endswith(f'/api/v0/tables/{response_table_id}/')
    assert schema_name in get_mathesar_schemas(create_mathesar_engine(test_db_name))


def test_schema_list(create_table, client, test_db_name):
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
    check_schema_response(response_schema, schema, 'Patents', test_db_name)


def test_schema_detail(create_table, client, test_db_name):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    create_table('NASA Schema Detail')

    schema = Schema.objects.get()
    response = client.get(f'/api/v0/schemas/{schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(response_schema, schema, 'Patents', test_db_name)


def test_schema_404(create_table, client):
    response = client.get('/api/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


def test_schema_create(client, test_db_name):
    num_schemas = Schema.objects.count()

    data = {
        'name': 'Test Schema',
        'database': test_db_name
    }
    response = client.post('/api/v0/schemas/', data=data)
    response_schema = response.json()
    schema = Schema.objects.get(id=response_schema['id'])

    assert response.status_code == 201
    assert Schema.objects.count() == num_schemas + 1
    check_schema_response(response_schema, schema, 'Test Schema', test_db_name, 0)


def test_schema_update(client, test_db_name):
    schema = create_schema_and_object('foo', test_db_name)
    data = {
        'name': 'blah'
    }
    response = client.put(f'/api/v0/schemas/{schema.id}/', data=data)
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_schema_partial_update(client, test_db_name):
    schema = create_schema_and_object('bar', test_db_name)
    data = {
        'name': 'blah'
    }
    response = client.patch(f'/api/v0/schemas/{schema.id}/', data=data)
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PATCH" not allowed.'


def test_schema_delete(client, test_db_name):
    schema = create_schema_and_object('baz', test_db_name)
    response = client.delete(f'/api/v0/schemas/{schema.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "DELETE" not allowed.'
