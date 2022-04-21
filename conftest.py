"""
This file should provide utilities for setting up test DBs and the like.  It's
intended to be the containment zone for anything specific about the testing
environment (e.g., the login info for the Postgres instance for testing)
"""
import pytest
import copy
from sqlalchemy import create_engine, text
from config.settings import DATABASES
from db.engine import add_custom_types_to_ischema_names

TEST_DB = "mathesar_db_test"


@pytest.fixture(scope="session")
def test_db_name():
    return TEST_DB


@pytest.fixture(scope="session")
def test_db(test_db_name):
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    yield test_db_name
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE {test_db_name} WITH (FORCE)"))


def _create_engine(test_db):
    engine = create_engine(
        _get_connection_string(
            DATABASES["default"]["USER"],
            DATABASES["default"]["PASSWORD"],
            DATABASES["default"]["HOST"],
            test_db,
        ),
        future=True,
        # Setting a fixed timezone makes the timezone aware test cases predictable.
        connect_args={"options": "-c timezone=utc -c lc_monetary=en_US.UTF-8"}
    )
    _make_ischema_names_unique(engine)
    return engine


def _make_ischema_names_unique(engine):
    """
    For some reason, engine.dialect.ischema_names reference the same dict across different engines.
    This resets it to a referentially unique copy of itself.
    """
    ischema_names = engine.dialect.ischema_names
    ischema_names_copy = copy.deepcopy(ischema_names)
    setattr(engine.dialect, "ischema_names", ischema_names_copy)


@pytest.fixture(scope="session")
def engine(test_db):
    engine = _create_engine(test_db)
    return engine


@pytest.fixture(scope="session")
def engine_with_ischema_names_updated(test_db):
    """
    This fixture does not inherit from the fixture `engine`, because it mutates the engine, which
    would otherwise taint tests depending on `engine`.
    """
    engine = _create_engine(test_db)
    add_custom_types_to_ischema_names(engine)
    return engine


APP_SCHEMA = "test_schema"


@pytest.fixture
def engine_with_schema(engine):
    schema = APP_SCHEMA
    _create_schema(engine, schema)
    yield engine, schema
    _drop_schema(engine, schema)


@pytest.fixture
def engine_with_schema_with_ischema_names_updated(engine_with_ischema_names_updated):
    engine = engine_with_ischema_names_updated
    schema = APP_SCHEMA
    _create_schema(engine, schema)
    yield engine, schema
    _drop_schema(engine, schema)


def _create_schema(engine, schema):
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {schema};"))


def _drop_schema(engine, schema):
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {schema} CASCADE;"))


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
