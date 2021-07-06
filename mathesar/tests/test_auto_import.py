from time import sleep

import pytest
from sqlalchemy import create_engine, text
from config.settings import DATABASES
from django.core.cache import cache
from django.conf import settings
from dj_database_url import parse as db_url

from db import schemas

AUTO_IMPORT_TEST_DB = "mathesar_auto_import_db_test"


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


@pytest.fixture()
def auto_import_test_db_name():
    return AUTO_IMPORT_TEST_DB


@pytest.fixture()
def auto_import_test_db_connection_string(auto_import_test_db_name):
    return _get_connection_string(
        DATABASES["default"]["USER"],
        DATABASES["default"]["PASSWORD"],
        DATABASES["default"]["HOST"],
        auto_import_test_db_name,
    )


@pytest.fixture()
def auto_import_test_db(auto_import_test_db_connection_string):
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {AUTO_IMPORT_TEST_DB} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {AUTO_IMPORT_TEST_DB}"))

    settings.DATABASES[AUTO_IMPORT_TEST_DB] = db_url(
        auto_import_test_db_connection_string
    )

    yield AUTO_IMPORT_TEST_DB

    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE {AUTO_IMPORT_TEST_DB} WITH (FORCE)"))

    del settings.DATABASES[AUTO_IMPORT_TEST_DB]


@pytest.fixture()
def auto_import_engine(auto_import_test_db, auto_import_test_db_connection_string):
    return create_engine(
        auto_import_test_db_connection_string,
        future=True,
    )


def test_auto_import_schema(auto_import_engine, client):
    test_schemas = ["test_schema_1", "test_schema_2"]
    for schema in test_schemas:
        schemas.create_schema(schema, auto_import_engine)

    cache.clear()
    response = client.get('/api/v0/schemas/')
    response_data = response.json()
    response_schemas = [
        s['name'] for s in response_data['results'] if s['name'] != 'public'
    ]

    assert response.status_code == 200
    assert len(response_schemas) == 2
    assert set(response_schemas) == set(test_schemas)
