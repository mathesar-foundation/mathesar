import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.schema import DropSchema
from config.settings import DATABASES
from django.core.cache import cache
from django.conf import settings
from dj_database_url import parse as db_url
from django.core.exceptions import ValidationError

from mathesar.models import Table, Schema, Database
from mathesar.reflection import reflect_db_objects
from db.schemas.operations.create import create_schema
from db.tables.operations.create import create_mathesar_table

MULTI_DB_TEST_DB = "mathesar_multi_db_test"


def _get_connection_string(username, password, hostname, database, port=5432):
    return f"postgresql://{username}:{password}@{hostname}:{port}/{database}"


def _get_superuser_engine():
    return create_engine(
        _get_connection_string(
            username=DATABASES["default"]["USER"],
            password=DATABASES["default"]["PASSWORD"],
            hostname=DATABASES["default"]["HOST"],
            database=DATABASES["default"]["NAME"],
        ),
        future=True,
    )


@pytest.fixture(scope="module")
def multi_db_test_db_name():
    return MULTI_DB_TEST_DB


@pytest.fixture(scope="module")
def multi_db_test_db_connection_string(multi_db_test_db_name):
    return _get_connection_string(
        DATABASES["default"]["USER"],
        DATABASES["default"]["PASSWORD"],
        DATABASES["default"]["HOST"],
        multi_db_test_db_name,
    )


@pytest.fixture(scope="module", autouse=True)
def multi_db_test_db(multi_db_test_db_connection_string):
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {MULTI_DB_TEST_DB} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {MULTI_DB_TEST_DB}"))

    settings.DATABASES[MULTI_DB_TEST_DB] = db_url(
        multi_db_test_db_connection_string
    )

    yield MULTI_DB_TEST_DB

    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE {MULTI_DB_TEST_DB} WITH (FORCE)"))

    del settings.DATABASES[MULTI_DB_TEST_DB]


@pytest.fixture(scope="module")
def multi_db_engine(multi_db_test_db_connection_string):
    return create_engine(
        multi_db_test_db_connection_string,
        future=True,
    )


def test_multi_db_schema(engine, multi_db_engine, client):
    test_schemas = ["test_schema_1", "test_schema_2"]
    for schema in test_schemas:
        create_schema(schema, engine)
        create_schema("multi_db_" + schema, multi_db_engine)

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

    # We have to delete the schemas to not break later tests
    with engine.begin() as conn:
        for schema in test_schemas:
            conn.execute(DropSchema(schema))


def test_multi_db_tables(engine, multi_db_engine, client):
    schema_name = "test_multi_db_tables_schema"
    test_tables = ["test_table_1", "test_table_2"]
    for table_name in test_tables:
        create_mathesar_table(table_name, schema_name, [], engine)
        create_mathesar_table(
            "multi_db_" + table_name, schema_name, [], multi_db_engine
        )

    cache.clear()
    response = client.get('/api/db/v0/tables/')
    response_tables = [s['name'] for s in response.json()['results']]

    assert response.status_code == 200
    expected_tables = test_tables + ["multi_db_" + s for s in test_tables]
    for table_name in expected_tables:
        assert table_name in response_tables

    # We have to delete the schema to not break later tests
    with engine.begin() as conn:
        conn.execute(DropSchema(schema_name, cascade=True))


def test_multi_db_oid_unique(multi_db_engine):
    # Ensure the same OID is allowed for different dbs
    reflect_db_objects()
    schema_oid = 5000
    table_oid = 5001
    for db in Database.objects.all():
        schema = Schema.objects.create(oid=schema_oid, database=db)
        Table.objects.create(oid=table_oid, schema=schema)


def test_single_db_oid_unique_exception():
    reflect_db_objects()
    table_oid = 5001
    db = Database.objects.all()[0]
    schema_1 = Schema.objects.create(oid=4000, database=db)
    schema_2 = Schema.objects.create(oid=5000, database=db)
    with pytest.raises(ValidationError):
        Table.objects.create(oid=table_oid, schema=schema_1)
        Table.objects.create(oid=table_oid, schema=schema_2)
