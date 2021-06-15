from sqlalchemy import text
from db.schemas import get_mathesar_schemas
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Schema
from mathesar.views import api
from mathesar import models
from mathesar.utils.schemas import create_schema_and_object


def check_schema_response(response_schema, schema, schema_name, test_db_name,
                          len_tables=1, check_schema_objects=True):
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
    if check_schema_objects:
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
    response_schema = [
        s for s in response_data['results'] if s['name'] != 'public'
    ][0]
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2
    check_schema_response(response_schema, schema, 'Patents', test_db_name)


def test_schema_list_filter(client, monkeypatch):
    schema_params = [("schema_1", "database_1"), ("schema_2", "database_2"),
                     ("schema_3", "database_3"), ("schema_1", "database_3")]

    def mock_get_name_from_oid(oid, engine):
        return schema_params[oid][0]

    monkeypatch.setattr(models.schemas, "get_schema_name_from_oid", mock_get_name_from_oid)
    monkeypatch.setattr(models, "create_mathesar_engine", lambda x: x)

    schemas = {
        (schema_params[i][0], schema_params[i][1]): Schema.objects.create(
            oid=i, database=schema_params[i][1]
        )
        for i in range(len(schema_params))
    }

    names = ["schema_1", "schema_3"]
    names_query = ",".join(names)
    databases = ["database_2", "database_3"]
    database_query = ",".join(databases)
    query = f"name={names_query}&database={database_query}"

    response = client.get(f'/api/v0/schemas/?{query}')
    response_data = response.json()
    response_schemas = response_data['results']

    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2

    response_schemas = {(schema["name"], schema["database"]): schema
                        for schema in response_schemas}
    for name in names:
        for database in databases:
            query_tuple = (name, database)
            if query_tuple not in schemas:
                continue
            schema = schemas[query_tuple]
            response_schema = response_schemas[query_tuple]
            check_schema_response(response_schema, schema, schema.name, schema.database,
                                  len_tables=0, check_schema_objects=False)


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


def test_schema_get_with_reflect_new(client, test_db_name):
    engine = create_mathesar_engine(test_db_name)
    schema_name = 'a_new_schema'
    engine.echo = True
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))

    num_schemas = Schema.objects.count()
    response = client.get('/api/v0/schemas/')
    # The schema number should only change after the GET request
    assert Schema.objects.count() == num_schemas + 1
    response_data = response.json()
    actual_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(actual_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name} CASCADE;'))
