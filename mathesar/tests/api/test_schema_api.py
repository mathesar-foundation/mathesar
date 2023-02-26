from django.core.cache import cache
import pytest
from sqlalchemy import text

from db.schemas.utils import get_mathesar_schemas, get_schema_oid_from_name
from mathesar.models.base import Schema
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.models.users import DatabaseRole


def check_schema_response(
        MOD_engine_cache,
        response_schema,
        schema,
        schema_name,
        test_db_name,
        schema_description=None,
        check_schema_objects=True
):
    assert response_schema['id'] == schema.id
    assert response_schema['name'] == schema_name
    assert response_schema['database'] == test_db_name
    assert response_schema['description'] == schema_description
    assert 'has_dependents' in response_schema
    if check_schema_objects:
        engine = MOD_engine_cache(test_db_name)
        assert schema_name in get_mathesar_schemas(engine)


list_clients_with_results_count = [
    ('superuser_client_factory', 3),
    ('db_manager_client_factory', 3),
    ('db_editor_client_factory', 3),
    ('schema_manager_client_factory', 1),
    ('schema_viewer_client_factory', 1),
    ('db_viewer_schema_manager_client_factory', 3)
]


@pytest.mark.parametrize('client_name, expected_schema_count', list_clients_with_results_count)
def test_schema_list(request, patent_schema, create_schema, MOD_engine_cache, client_name, expected_schema_count):
    create_schema("Private Schema")
    client = request.getfixturevalue(client_name)(patent_schema)
    response = client.get('/api/db/v0/schemas/')
    assert response.status_code == 200

    response_data = response.json()

    assert response_data['count'] == expected_schema_count
    results = response_data['results']
    assert len(results) == expected_schema_count

    response_schema = None
    for some_schema in response_data['results']:
        if some_schema['name'] == patent_schema.name:
            response_schema = some_schema
    assert response_schema is not None
    check_schema_response(
        MOD_engine_cache,
        response_schema,
        patent_schema,
        patent_schema.name,
        patent_schema.database.name,
    )


@pytest.mark.skip("Faulty DB handling assumptions; invalid")
def test_schema_list_filter(client, create_db_schema, FUN_create_dj_db, MOD_engine_cache):
    schema_params = [("schema_1", "database_1"), ("schema_2", "database_2"),
                     ("schema_3", "database_3"), ("schema_1", "database_3")]

    dbs_to_create = set(param[1] for param in schema_params)

    for db_name in dbs_to_create:
        FUN_create_dj_db(db_name)

    for schema_name, db_name in schema_params:
        engine = MOD_engine_cache(db_name)
        create_db_schema(schema_name, engine)

    cache.clear()

    schemas = {
        schema_param: Schema.objects.get(
            oid=get_schema_oid_from_name(
                schema_param[0],
                MOD_engine_cache(schema_param[1])
            ),
        )
        for schema_param in schema_params
    }

    names = ["schema_1", "schema_3"]
    names_query = ",".join(names)
    databases = ["database_2", "database_3"]
    database_query = ",".join(databases)
    query = f"name={names_query}&database={database_query}"

    response = client.get(f'/api/db/v0/schemas/?{query}')
    response_data = response.json()
    response_schemas = response_data['results']

    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2

    response_schemas = {
        (schema["name"], schema["database"]): schema
        for schema in response_schemas
    }

    for name in names:
        for database in databases:
            query_tuple = (name, database)
            if query_tuple not in schema_params:
                continue
            schema = schemas[query_tuple]
            response_schema = response_schemas[query_tuple]
            check_schema_response(
                MOD_engine_cache,
                response_schema, schema, schema.name,
                schema.database.name, check_schema_objects=False
            )


list_clients_with_num_tables_count = [
    ('superuser_client_factory', 3),
    ('db_manager_client_factory', 3),
    ('db_editor_client_factory', 2),
    ('schema_manager_client_factory', 3),
    ('schema_viewer_client_factory', 2),
    ('db_viewer_schema_manager_client_factory', 3)
]


@pytest.mark.parametrize('client_name, expected_num_tables_count', list_clients_with_num_tables_count)
def test_schema_num_tables_with_multiple_roles(
        request,
        create_patents_table,
        patent_schema,
        client_name,
        expected_num_tables_count
):
    create_patents_table("Patent Table 1")
    table_2 = create_patents_table("Patent Table 2")
    table_3 = create_patents_table("Patent Table 3")
    table_2.import_verified = True
    table_3.import_verified = None
    table_2.save()
    table_3.save()
    client = request.getfixturevalue(client_name)(patent_schema)
    response = client.get('/api/db/v0/schemas/')
    assert response.status_code == 200
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    for someschema in response_schemas:
        assert someschema['num_tables'] == expected_num_tables_count


def test_schema_detail(create_patents_table, client, test_db_name, MOD_engine_cache):
    """
    Desired format:
    One item in the results list in the schema list view, see above.
    """
    table = create_patents_table('NASA Schema Detail')

    response = client.get(f'/api/db/v0/schemas/{table.schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(
        MOD_engine_cache,
        response_schema, table.schema, table.schema.name, test_db_name
    )


def test_schema_sort_by_name(create_schema, client, MOD_engine_cache):
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
    response = client.get('/api/db/v0/schemas/')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, unsorted_expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(
            MOD_engine_cache, comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
            comparison_tuple[1].database.name
        )
    sort_field = "name"
    response = client.get(f'/api/db/v0/schemas/?sort_by={sort_field}')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(
            MOD_engine_cache, comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
            comparison_tuple[1].database.name
        )


def test_schema_sort_by_id(create_schema, client, MOD_engine_cache):
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
    response = client.get('/api/db/v0/schemas/')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, unsorted_expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(
            MOD_engine_cache,
            comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
            comparison_tuple[1].database.name
        )

    response = client.get('/api/db/v0/schemas/?sort_by=id')
    response_data = response.json()
    response_schemas = [s for s in response_data['results'] if s['name'] != 'public']
    comparison_tuples = zip(response_schemas, expected_schemas)
    for comparison_tuple in comparison_tuples:
        check_schema_response(
            MOD_engine_cache,
            comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name,
            comparison_tuple[1].database.name
        )


def test_schema_create_by_superuser(client, FUN_create_dj_db, MOD_engine_cache):
    db_name = "some_db1"
    FUN_create_dj_db(db_name)

    schema_count_before = Schema.objects.count()

    schema_name = 'Test Schema'
    data = {
        'name': schema_name,
        'database': db_name
    }
    response = client.post('/api/db/v0/schemas/', data=data)
    response_schema = response.json()

    assert response.status_code == 201
    schema_count_after = Schema.objects.count()
    assert schema_count_after == schema_count_before + 1
    schema = Schema.objects.get(id=response_schema['id'])
    check_schema_response(
        MOD_engine_cache,
        response_schema,
        schema,
        schema_name,
        db_name,
        check_schema_objects=0
    )


def test_schema_create_by_db_manager(client_bob, user_bob, FUN_create_dj_db, get_uid):
    db_name = get_uid()
    role = "manager"
    database = FUN_create_dj_db(db_name)

    schema_name = 'Test Schema'
    data = {
        'name': schema_name,
        'database': db_name
    }
    response = client_bob.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 400

    DatabaseRole.objects.create(database=database, user=user_bob, role=role)
    response = client_bob.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 201


def test_schema_create_by_db_editor(client_bob, user_bob, FUN_create_dj_db, get_uid):
    db_name = get_uid()
    role = "editor"
    database = FUN_create_dj_db(db_name)
    DatabaseRole.objects.create(database=database, user=user_bob, role=role)

    schema_name = 'Test Schema'
    data = {
        'name': schema_name,
        'database': db_name
    }
    response = client_bob.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 400


def test_schema_create_multiple_existing_roles(client_bob, user_bob, FUN_create_dj_db, get_uid):
    database_with_viewer_access = FUN_create_dj_db(get_uid())
    database_with_manager_access = FUN_create_dj_db(get_uid())
    FUN_create_dj_db(get_uid())
    DatabaseRole.objects.create(user=user_bob, database=database_with_viewer_access, role='viewer')
    DatabaseRole.objects.create(user=user_bob, database=database_with_manager_access, role='manager')

    schema_name = 'Test Schema'
    data = {
        'name': schema_name,
        'database': database_with_viewer_access.name
    }
    response = client_bob.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 400
    data['database'] = database_with_manager_access.name
    response = client_bob.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 201


@pytest.mark.skip("Faulty DB handling assumptions; invalid")
def test_schema_create_description(client, FUN_create_dj_db, MOD_engine_cache):
    db_name = "some_db2"
    FUN_create_dj_db(db_name)

    schema_count_before = Schema.objects.count()

    schema_name = 'Test Schema with description'
    description = 'blah blah blah'
    data = {
        'name': schema_name,
        'database': db_name,
        'description': description,
    }
    response = client.post('/api/db/v0/schemas/', data=data)
    response_schema = response.json()

    assert response.status_code == 201
    schema_count_after = Schema.objects.count()
    assert schema_count_after == schema_count_before + 1
    schema = Schema.objects.get(id=response_schema['id'])
    check_schema_response(
        MOD_engine_cache,
        response_schema,
        schema,
        schema_name,
        db_name,
        schema_description=description,
        check_schema_objects=0,
    )


def test_schema_update(client, create_schema):
    schema = create_schema('foo')
    data = {
        'name': 'blah'
    }
    response = client.put(f'/api/db/v0/schemas/{schema.id}/', data=data)
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "PUT" not allowed.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_schema_partial_update(create_schema, client, test_db_name, MOD_engine_cache):
    schema_name = 'NASA Schema Partial Update'
    new_schema_name = 'NASA Schema Partial Update New'
    schema = create_schema(schema_name)

    body = {'name': new_schema_name}
    response = client.patch(f'/api/db/v0/schemas/{schema.id}/', body)

    response_schema = response.json()
    assert response.status_code == 200
    check_schema_response(MOD_engine_cache, response_schema, schema, new_schema_name, test_db_name)

    schema = Schema.objects.get(oid=schema.oid)
    assert schema.name == new_schema_name


update_clients_with_status_code = [
    ('superuser_client_factory', 200),
    ('db_manager_client_factory', 200),
    ('db_editor_client_factory', 403),
    ('schema_manager_client_factory', 200),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 200)
]


@pytest.mark.parametrize('client_name, expected_status_code', update_clients_with_status_code)
def test_schema_patch_same_name(create_schema, request, client_name, expected_status_code):
    schema_name = 'Patents Schema Same Name'
    schema = create_schema(schema_name)
    client = request.getfixturevalue(client_name)(schema)
    body = {'name': schema_name}
    response = client.patch(f'/api/db/v0/schemas/{schema.id}/', body)
    assert response.status_code == expected_status_code


def test_schema_delete(create_schema, client):
    schema_name = 'NASA Schema Delete'
    schema = create_schema(schema_name)

    response = client.delete(f'/api/db/v0/schemas/{schema.id}/')
    assert response.status_code == 204

    # Ensure the Django model was deleted
    existing_oids = {schema.oid for schema in Schema.objects.all()}
    assert schema.oid not in existing_oids


delete_clients_with_status_code = [
    ('superuser_client_factory', 204),
    ('db_manager_client_factory', 204),
    ('db_editor_client_factory', 403),
    ('schema_manager_client_factory', 204),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 204)
]


@pytest.mark.parametrize('client_name, expected_status_code', delete_clients_with_status_code)
def test_schema_delete_by_different_roles(create_schema, request, client_name, expected_status_code):
    schema_name = 'NASA Schema Delete'
    schema = create_schema(schema_name)
    client = request.getfixturevalue(client_name)(schema)
    response = client.delete(f'/api/db/v0/schemas/{schema.id}/')
    assert response.status_code == expected_status_code


def test_schema_dependents(client, create_schema):
    schema_name = 'NASA Schema Dependencies'
    schema = create_schema(schema_name)

    response = client.get(f'/api/db/v0/schemas/{schema.id}/')
    response_schema = response.json()
    assert response.status_code == 200
    assert response_schema['has_dependents'] is False


def test_schema_detail_404(client):
    response = client.get('/api/db/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_partial_update_404(client):
    response = client.patch('/api/db/v0/schemas/3000/', {})
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_delete_404(client):
    response = client.delete('/api/db/v0/schemas/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_schema_get_with_reflect_new(client, engine):
    schema_name = 'a_new_schema'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))
    response = client.get('/api/db/v0/schemas/')
    # The schema number should only change after the GET request
    response_data = response.json()
    actual_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(actual_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name} CASCADE;'))


def test_schema_get_with_reflect_change(client, engine, create_db_schema):
    schema_name = 'a_new_schema'
    create_db_schema(schema_name, engine)
    response = client.get('/api/db/v0/schemas/')
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
    response = client.get('/api/db/v0/schemas/')
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


@pytest.mark.skip("Faulty DB handling assumptions; invalid")
def test_schema_create_duplicate(client, FUN_create_dj_db):
    db_name = "tmp_db1"
    FUN_create_dj_db(db_name)

    data = {
        'name': 'Test Duplication Schema',
        'database': db_name
    }
    response = client.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 201
    response = client.post('/api/db/v0/schemas/', data=data)
    assert response.status_code == 400


def test_schema_get_with_reflect_delete(client, engine, create_db_schema):
    schema_name = 'a_new_schema'
    create_db_schema(schema_name, engine)

    response = client.get('/api/db/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name};'))
    cache.clear()
    response = client.get('/api/db/v0/schemas/')
    response_data = response.json()
    orig_created = [
        schema for schema in response_data['results'] if schema['name'] == schema_name
    ]
    assert len(orig_created) == 0
