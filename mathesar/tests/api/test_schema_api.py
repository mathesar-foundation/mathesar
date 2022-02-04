from django.core.cache import cache
from sqlalchemy import text
from unittest.mock import patch

from db.schemas.utils import get_mathesar_schemas
from mathesar import models
from mathesar import reflection
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.database.base import create_mathesar_engine
from mathesar.utils.schemas import create_schema_and_object


def check_schema_response(response_schema, schema, schema_name, test_db_name, check_schema_objects=True):
    assert response_schema['id'] == schema.id
    assert response_schema['name'] == schema_name
    assert response_schema['database'] == test_db_name
    assert 'has_dependencies' in response_schema
    if check_schema_objects:
        assert schema_name in get_mathesar_schemas(
            create_mathesar_engine(test_db_name)
        )


def test_schema_list(client, patent_schema, empty_nasa_table):
    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schema = [
        s for s in response_data['results'] if s['name'] != 'public'
    ][0]

    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2
    check_schema_response(response_schema, patent_schema, patent_schema.name,
                          patent_schema.database.name)


def test_schema_list_filter(client, monkeypatch):
    schema_params = [("schema_1", "database_1"), ("schema_2", "database_2"),
                     ("schema_3", "database_3"), ("schema_1", "database_3")]
    dbs = {
        "database_1": models.Database.objects.create(name="database_1"),
        "database_2": models.Database.objects.create(name="database_2"),
        "database_3": models.Database.objects.create(name="database_3"),
    }

    def mock_get_name_from_oid(oid, engine):
        return schema_params[oid][0]

    monkeypatch.setattr(models.schema_utils, "get_schema_name_from_oid", mock_get_name_from_oid)
    monkeypatch.setattr(models, "create_mathesar_engine", lambda x: x)
    monkeypatch.setattr(reflection, "reflect_db_objects", lambda: None)

    schemas = {
        (schema_params[i][0], schema_params[i][1]): models.Schema.objects.create(
            oid=i, database=dbs[schema_params[i][1]]
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
            check_schema_response(response_schema, schema, schema.name,
                                  schema.database.name, check_schema_objects=False)


def test_schema_detail(create_table, client, test_db_name):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    create_table('NASA Schema Detail')

    schema = models.Schema.objects.get()
    response = client.get(f'/api/v0/schemas/{schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(response_schema, schema, 'Patents', test_db_name)


def test_schema_sort_by_name(create_schema, client):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    schema_3 = create_schema("Schema 3")
    schema_1 = create_schema("Schema 1")
    schema_5 = create_schema("Schema 5")
    schema_2 = create_schema("Schema 2")
    schema_4 = create_schema("Schema 4")
    unsorted_expected_schemas = [
        schema_4,
        schema_2,
        schema_5,
        schema_1,
        schema_3
    ]
    expected_schemas = [
        schema_1,
        schema_2,
        schema_3,
        schema_4,
        schema_5
    ]
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, unsorted_expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
                              comparison_tuple[1].database.name)
    sort_field = "name"
    response = client.get(f'/api/v0/schemas/?sort_by={sort_field}')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
                              comparison_tuple[1].database.name)


def test_schema_sort_by_id(create_schema, client):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    schema_1 = create_schema("desiderium parma!")
    schema_2 = create_schema("Cur bursa messis?")
    schema_3 = create_schema("Historias")
    schema_4 = create_schema("Confucius says")
    schema_5 = create_schema("Nanomachines")
    unsorted_expected_schemas = [
        schema_5,
        schema_4,
        schema_3,
        schema_2,
        schema_1
    ]
    expected_schemas = [
        schema_1,
        schema_2,
        schema_3,
        schema_4,
        schema_5
    ]
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, unsorted_expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
                              comparison_tuple[1].database.name)

    response = client.get('/api/v0/schemas/?sort_by=id')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
                              comparison_tuple[1].database.name)


def test_schema_create(client, test_db_name):
    num_schemas = models.Schema.objects.count()

    data = {
        'name': 'Test Schema',
        'database': test_db_name
    }
    response = client.post('/api/v0/schemas/', data=data)
    response_schema = response.json()
    schema = models.Schema.objects.get(id=response_schema['id'])

    assert response.status_code == 201
    assert models.Schema.objects.count() == num_schemas + 1
    check_schema_response(response_schema, schema, 'Test Schema', test_db_name, 0)


def test_schema_update(client, test_db_name):
    schema = create_schema_and_object('foo', test_db_name)
    data = {
        'name': 'blah'
    }
    response = client.put(f'/api/v0/schemas/{schema.id}/', data=data)
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "PUT" not allowed.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_schema_partial_update(create_schema, client, test_db_name):
    schema_name = 'NASA Schema Partial Update'
    new_schema_name = 'NASA Schema Partial Update New'
    schema = create_schema(schema_name)

    body = {'name': new_schema_name}
    response = client.patch(f'/api/v0/schemas/{schema.id}/', body)

    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(response_schema, schema, new_schema_name, test_db_name,)

    schema = models.Schema.objects.get(oid=schema.oid)
    assert schema.name == new_schema_name


def test_schema_patch_same_name(create_schema, client, test_db_name):
    schema_name = 'Patents Schema Same Name'
    schema = create_schema(schema_name)

    body = {'name': schema_name}
    response = client.patch(f'/api/v0/schemas/{schema.id}/', body)

    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(
        response_schema,
        schema,
        schema_name,
        test_db_name
    )
    schema = models.Schema.objects.get(oid=schema.oid)
    assert schema.name == schema_name


def test_schema_delete(create_schema, client):
    schema_name = 'NASA Schema Delete'
    schema = create_schema(schema_name)

    with patch.object(models, 'drop_schema') as mock_infer:
        response = client.delete(f'/api/v0/schemas/{schema.id}/')
    assert response.status_code == 204

    # Ensure the Django model was deleted
    existing_oids = {schema.oid for schema in models.Schema.objects.all()}
    assert schema.oid not in existing_oids

    # Ensure the backend schema would have been deleted
    assert mock_infer.call_args is not None
    assert mock_infer.call_args[0] == (
        schema.name,
        schema._sa_engine,
    )
    assert mock_infer.call_args[1] == {
        'cascade': True
    }


def test_schema_dependencies(client, create_schema):
    schema_name = 'NASA Schema Dependencies'
    schema = create_schema(schema_name)

    response = client.get(f'/api/v0/schemas/{schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    assert response_schema['has_dependencies'] is True


def test_schema_detail_404(client):
    response = client.get('/api/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_partial_update_404(client):
    response = client.patch('/api/v0/schemas/3000/', {})
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_delete_404(client):
    response = client.delete('/api/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_get_with_reflect_new(client, test_db_name):
    engine = create_mathesar_engine(test_db_name)
    schema_name = 'a_new_schema'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))
    cache.clear()
    response = client.get('/api/v0/schemas/')
    # The schema number should only change after the GET request
    response_data = response.json()
    actual_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(actual_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name} CASCADE;'))


def test_schema_get_with_reflect_change(client, test_db_name):
    engine = create_mathesar_engine(test_db_name)
    schema_name = 'a_new_schema'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))

    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 1
    orig_id = orig_created[0]['id']
    new_schema_name = 'even_newer_schema'
    with engine.begin() as conn:
        conn.execute(text(f'ALTER SCHEMA {schema_name} RENAME TO {new_schema_name};'))
    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 0
    modified = [
        schema for schema in response_data['results'] if schema['name'] == new_schema_name
    ]
    modified_id = modified[0]['id']
    assert len(modified) == 1
    assert orig_id == modified_id


def test_schema_create_duplicate(client, test_db_name):
    data = {
        'name': 'Test Duplication Schema',
        'database': test_db_name
    }
    response = client.post('/api/v0/schemas/', data=data)
    assert response.status_code == 201
    response = client.post('/api/v0/schemas/', data=data)
    assert response.status_code == 400


def test_schema_get_with_reflect_delete(client, test_db_name):
    engine = create_mathesar_engine(test_db_name)
    schema_name = 'a_new_schema'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))

    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name};'))
    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 0


def test_schema_viewset_sets_cache(client):
    cache.delete(reflection.DB_REFLECTION_KEY)
    assert not cache.get(reflection.DB_REFLECTION_KEY)
    client.get('/api/v0/schemas/')
    assert cache.get(reflection.DB_REFLECTION_KEY)


def test_schema_viewset_checks_cache(client):
    cache.delete(reflection.DB_REFLECTION_KEY)
    with patch.object(reflection, 'reflect_schemas_from_database') as mock_reflect:
        client.get('/api/v0/schemas/')
    mock_reflect.assert_called()
