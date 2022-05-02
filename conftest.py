"""
This file should provide utilities for setting up test DBs and the like.  It's
intended to be the containment zone for anything specific about the testing
environment (e.g., the login info for the Postgres instance for testing)
"""
import pytest
from sqlalchemy import text
from config.settings import DATABASES
from db.engine import add_custom_types_to_ischema_names, create_engine
from db.types import install
from db.schemas.operations.create import create_schema
from db.schemas.operations.drop import drop_schema


@pytest.fixture(scope="session")
def test_db_name():
    test_db_name = "mathesar_db_test"
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    yield test_db_name
    with superuser_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE {test_db_name} WITH (FORCE)"))


@pytest.fixture(scope="session")
def engine(test_db_name):
    engine = _create_engine(test_db_name)
    return engine


@pytest.fixture(scope="session")
def engine_with_ischema_names_updated(test_db_name):
    """
    This fixture does not inherit from the fixture `engine`, because it mutates the engine, which
    would otherwise taint tests depending on `engine`.
    """
    engine = _create_engine(test_db_name)
    add_custom_types_to_ischema_names(engine)
    return engine


@pytest.fixture
def test_schema_name():
    return "test_schema"


@pytest.fixture
def engine_with_schema(engine, test_schema_name):
    schema = test_schema_name
    _create_schema(engine, schema)
    yield engine, schema
    _drop_schema(engine, schema)


@pytest.fixture
def engine_with_schema_with_ischema_names_updated(engine_with_ischema_names_updated, test_schema_name):
    engine = engine_with_ischema_names_updated
    schema = test_schema_name
    _create_schema(engine, schema)
    yield engine, schema
    _drop_schema(engine, schema)


@pytest.fixture
def engine_with_mathesar(engine_with_schema_with_ischema_names_updated):
    engine, schema = engine_with_schema_with_ischema_names_updated
    install.install_mathesar_on_database(engine)
    yield engine, schema
    install.uninstall_mathesar_from_database(engine)


def _create_schema(engine, schema):
    create_schema(schema, engine)


def _drop_schema(engine, schema):
    drop_schema(schema, engine, cascade=True, if_exists=False)


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


def _create_engine(db_name):
    engine = create_engine(
        _get_connection_string(
            DATABASES["default"]["USER"],
            DATABASES["default"]["PASSWORD"],
            DATABASES["default"]["HOST"],
            db_name,
        ),
        future=True,
        # Setting a fixed timezone makes the timezone aware test cases predictable.
        connect_args={"options": "-c timezone=utc -c lc_monetary=en_US.UTF-8"}
    )
    return engine
