import pytest
from django.core.cache import cache
from django.core.exceptions import ValidationError

from mathesar.models.base import Table, Schema, Database
from mathesar.reflection import reflect_db_objects


@pytest.fixture(autouse=True)
def multi_db_test_db(FUN_create_dj_db, uid):
    db_name = f"mathesar_multi_db_test_{uid}"
    FUN_create_dj_db(db_name)
    return db_name


@pytest.fixture
def multi_db_engine(multi_db_test_db, MOD_engine_cache):
    return MOD_engine_cache(multi_db_test_db)


def test_multi_db_schema(engine, multi_db_engine, client, create_db_schema):
    test_schemas = ["test_schema_1", "test_schema_2"]
    for schema_name in test_schemas:
        create_db_schema(schema_name, engine)
        create_db_schema("multi_db_" + schema_name, multi_db_engine)

    cache.clear()
    response = client.get('/api/db/v0/schemas/')
    response_data = response.json()
    response_schemas = [
        s['name'] for s in response_data['results'] if s['name'] != 'public'
    ]

    assert response.status_code == 200
    assert len(response_schemas) == 4

    expected_schemas = test_schemas + ["multi_db_" + s for s in test_schemas]
    assert set(response_schemas) == set(expected_schemas)


def test_multi_db_tables(engine, multi_db_engine, client, create_mathesar_table):
    schema_name = "test_multi_db_tables_schema"
    test_tables = ["test_table_1", "test_table_2"]
    for table_name in test_tables:
        create_mathesar_table(table_name, schema_name, [], engine)
        create_mathesar_table(
            "multi_db_" + table_name, schema_name, [], multi_db_engine
        )

    cache.clear()
    response = client.get('/api/db/v0/tables/')

    assert response.status_code == 200

    response_tables = [s['name'] for s in response.json()['results']]
    expected_tables = test_tables + ["multi_db_" + s for s in test_tables]
    for table_name in expected_tables:
        assert table_name in response_tables


def test_multi_db_oid_unique():
    """
    Ensure the same OID is allowed for different dbs
    """
    reflect_db_objects()
    schema_oid = 5000
    table_oid = 5001
    for db in Database.objects.all():
        schema = Schema.objects.create(oid=schema_oid, database=db)
        Table.objects.create(oid=table_oid, schema=schema)


def test_single_db_oid_unique_exception():
    reflect_db_objects()
    table_oid = 5001
    dbs = Database.objects.all()
    assert len(dbs) > 0
    db = dbs[0]
    schema_1 = Schema.objects.create(oid=4000, database=db)
    schema_2 = Schema.objects.create(oid=5000, database=db)
    with pytest.raises(ValidationError):
        Table.objects.create(oid=table_oid, schema=schema_1)
        Table.objects.create(oid=table_oid, schema=schema_2)
