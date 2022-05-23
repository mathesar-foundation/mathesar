"""
This file should provide utilities for setting up test DBs and the like.  It's
intended to be the containment zone for anything specific about the testing
environment (e.g., the login info for the Postgres instance for testing)
"""
import pytest
import random
import string

from django.db import connection as dj_connection

from sqlalchemy_utils import database_exists, create_database, drop_database
from sqlalchemy.exc import OperationalError

from db.engine import add_custom_types_to_ischema_names, create_engine
from db.types import install
from db.schemas.operations.drop import drop_schema as drop_sa_schema
from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_oid_from_name, get_schema_name_from_oid


@pytest.fixture(scope="session")
def worker_id(worker_id):
    """
    Guaranteed to always be a non-empty string.

    Returns 'master' when we're not parallelizing, 'gw0', 'gw1', etc., otherwise.
    """
    return worker_id


@pytest.fixture(scope="session")
def get_uid(worker_id):
    """
    A factory of session-unique 4 letter strings.
    """
    used_uids = set()
    def _get_uid():
        letters = string.ascii_letters
        candidate = "".join(random.sample(letters, 4))
        if worker_id:
            candidate = worker_id + '_' + candidate
        if candidate not in used_uids:
            used_uids.add(candidate)
            return candidate
        else:
            return _get_uid()
    yield _get_uid


@pytest.fixture(scope="function")
def uid(get_uid):
    """
    A session-unique string.
    """
    return get_uid()


def _get_connection_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"


def _create_engine(db_name):
    dj_connection_settings = dj_connection.settings_dict
    engine = create_engine(
        _get_connection_string(
            username=dj_connection_settings["USER"],
            password=dj_connection_settings["PASSWORD"],
            hostname=dj_connection_settings["HOST"],
            database=db_name,
        ),
        future=True,
        # Setting a fixed timezone makes the timezone aware test cases predictable.
        connect_args={"options": "-c timezone=utc -c lc_monetary=en_US.UTF-8"}
    )
    return engine


def _create_db():
    """
    A factory for Postgres mathesar-installed databases. A fixture made of this method tears down
    created dbs when leaving scope.

    This method is used to create two fixtures with different scopes, that's why it's not a fixture
    itself.
    """
    created_dbs = set()
    def __create_db(db_name):
        engine = _create_engine(db_name)
        if database_exists(engine.url):
            drop_database(engine.url)
        create_database(engine.url)
        created_dbs.add(db_name)
        # Our default testing database has our types and functions preinstalled.
        install.install_mathesar_on_database(engine)
        return db_name
    yield __create_db
    for db_name in created_dbs:
        engine = _create_engine(db_name)
        if database_exists(engine.url):
            drop_database(engine.url)


# This factory will clean up its created dbs after each test function that it's used in.
# Useful when doing API stuff that would otherwise be bothersome to clean up.
# TODO padaryti kad duombaze butu ideta ir isimta is settings.DATABASES
# kaip tai daroma kituose fixtures?
create_temp_db = pytest.fixture(_create_db, scope="function")


# This factory will clean up its created dbs after its module is finished testing.
create_module_db = pytest.fixture(_create_db, scope="module")


# This factory will clean up its created dbs after the whole testing session is finished.
create_session_db = pytest.fixture(_create_db, scope="session")



@pytest.fixture(scope="session", autouse=True)
def test_db_name(worker_id, create_session_db):
    """
    A dynamic, yet non-random, db_name is used so that subsequent runs would automatically clean up
    test databases that we failed to tear down.
    """
    default_test_db_name = "mathesar_db_test"
    db_name = f"{default_test_db_name}_{worker_id}"
    create_session_db(db_name)
    yield db_name


# TODO does testing this make sense?
@pytest.fixture(scope="session")
def engine_without_ischema_names_updated(test_db_name):
    """
    For testing environments where an engine might not be fully setup.
    """
    engine = _create_engine(test_db_name)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def engine(test_db_name):
    engine = _create_engine(test_db_name)
    add_custom_types_to_ischema_names(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def _test_schema_name():
    return "_test_schema_name"


@pytest.fixture
def engine_with_schema_without_updated_ischema_names(
    engine_without_ischema_names_updated, _test_schema_name, create_db_schema
):
    engine = engine_without_ischema_names_updated
    schema_name = _test_schema_name
    create_db_schema(schema_name, engine)
    yield engine, schema_name


@pytest.fixture
def engine_with_schema(engine, _test_schema_name, create_db_schema):
    schema_name = _test_schema_name
    create_db_schema(schema_name, engine)
    yield engine, schema_name


@pytest.fixture
def create_db_schema():
    """
    Creates a DB schema factory, making sure to track and clean up new instances
    """
    created_schemas = {}
    def _create_schema(schema_name, engine, schema_mustnt_exist=True):
        if schema_mustnt_exist:
            assert schema_name not in created_schemas
        create_sa_schema(schema_name, engine)
        schema_oid = get_schema_oid_from_name(schema_name, engine)
        engine_url = engine.url
        created_schemas_in_this_engine = created_schemas.setdefault(engine_url, {})
        created_schemas_in_this_engine[schema_name] = schema_oid
        return schema_name
    yield _create_schema
    for engine_url, created_schemas_in_this_engine in created_schemas.items():
        engine = create_engine(engine_url)
        try:
            for _, schema_oid in created_schemas_in_this_engine.items():
                # Handle schemas being renamed during test
                schema_name = get_schema_name_from_oid(schema_oid, engine)
                if schema_name:
                    drop_sa_schema(schema_name, engine, cascade=True, if_exists=True)
        except OperationalError:
            pass
