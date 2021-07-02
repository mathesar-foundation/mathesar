import pytest
from sqlalchemy import create_engine, text
from config.settings import DATABASES
from django.core.cache import cache

from db import schemas

AUTO_IMPORT_TEST_DB = "mathesar_auto_import_db_test"


@pytest.fixture(scope="module")
def auto_import_test_db_name():
    return AUTO_IMPORT_TEST_DB


@pytest.fixture(scope="module")
def auto_import_test_db():
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {AUTO_IMPORT_TEST_DB} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {AUTO_IMPORT_TEST_DB}"))

    yield AUTO_IMPORT_TEST_DB

    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE {AUTO_IMPORT_TEST_DB} WITH (FORCE)"))


@pytest.fixture(scope="module")
def auto_import_engine(auto_import_test_db):
    return create_engine(
        _get_connection_string(
            DATABASES["default"]["USER"],
            DATABASES["default"]["PASSWORD"],
            DATABASES["default"]["HOST"],
            auto_import_test_db,
        ),
        future=True,
    )


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


def _get_connection_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"


def test_auto_import_schema(auto_import_engine, client):
    test_schemas = ["test_schema_1", "test_schema_2"]
    for schema in test_schemas:
        schemas.create_schema(schema, auto_import_engine)

    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    print(response_data)
    response_schemas = [
        s for s in response_data['results'] if s['name'] != 'public'
    ][0]
    print(response_schemas)

    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 4
    assert response_schemas == test_schemas
