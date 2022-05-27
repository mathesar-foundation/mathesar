"""
TODO
"""
import pytest
import random
import string

from sqlalchemy.exc import OperationalError

from db.engine import add_custom_types_to_ischema_names
from db.schemas.operations.drop import drop_schema as drop_sa_schema
from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_oid_from_name, get_schema_name_from_oid

from testing.utils import create_scoped_fixtures, get_fixture_value
from testing import impls


_fixture_impls_to_bootstrap = (
    impls.engine_cache,
    impls.create_db,
)


for fixture_impl in _fixture_impls_to_bootstrap:
    create_scoped_fixtures(globals(), fixture_impl)


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
    A factory of worker-session-unique 4 letter strings.
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
    A worker-session-unique string.
    """
    return get_uid()


@pytest.fixture(scope="session", autouse=True)
def test_db_name(worker_id, SES_create_db):
    """
    A dynamic, yet non-random, db_name is used so that subsequent runs would automatically clean up
    test databases that we failed to tear down.
    """
    create_db = SES_create_db
    default_test_db_name = "mathesar_db_test"
    db_name = f"{default_test_db_name}_{worker_id}"
    create_db(db_name)
    yield db_name


@pytest.fixture(scope="session")
def engine(test_db_name, SES_engine_cache):
    engine_cache = SES_engine_cache
    engine = engine_cache(test_db_name)
    add_custom_types_to_ischema_names(engine)
    return engine


@pytest.fixture(scope="session")
def _test_schema_name():
    return "_test_schema_name"


# TODO does testing this make sense?
@pytest.fixture(scope="module")
def engine_without_ischema_names_updated(test_db_name, MOD_engine_cache):
    """
    For testing environments where an engine might not be fully setup.

    We instantiate a new engine cache, without updating its ischema_names dict.
    """
    return MOD_engine_cache(test_db_name)


# TODO seems unneeded: remove
@pytest.fixture
def engine_with_schema_without_ischema_names_updated(
    engine_without_ischema_names_updated, _test_schema_name, create_db_schema
):
    engine = engine_without_ischema_names_updated
    schema_name = _test_schema_name
    create_db_schema(schema_name, engine)
    return engine, schema_name


@pytest.fixture
def engine_with_schema(engine, _test_schema_name, create_db_schema):
    schema_name = _test_schema_name
    create_db_schema(schema_name, engine)
    return engine, schema_name


@pytest.fixture
def create_db_schema(SES_engine_cache):
    """
    Creates a DB schema factory, making sure to track and clean up new instances.

    Schema setup and teardown is very fast, so we'll only use this fixture with the default
    "function" scope.
    """
    engine_cache = SES_engine_cache

    import logging
    logger = logging.getLogger('create_db_schema')
    logger.debug('enter')
    created_schemas = {}

    def _create_schema(schema_name, engine, schema_mustnt_exist=True):
        logger.debug('eval')
        if schema_mustnt_exist:
            assert schema_name not in created_schemas
        logger.debug(f'creating {schema_name}')
        create_sa_schema(schema_name, engine)
        schema_oid = get_schema_oid_from_name(schema_name, engine)
        db_name = engine.url.database
        created_schemas_in_this_engine = created_schemas.setdefault(db_name, {})
        created_schemas_in_this_engine[schema_name] = schema_oid
        return schema_name
    yield _create_schema
    logger.debug('about to clean up')
    for db_name, created_schemas_in_this_engine in created_schemas.items():
        engine = engine_cache(db_name)
        try:
            for _, schema_oid in created_schemas_in_this_engine.items():
                # Handle schemas being renamed during test
                schema_name = get_schema_name_from_oid(schema_oid, engine)
                if schema_name:
                    drop_sa_schema(schema_name, engine, cascade=True, if_exists=True)
                    logger.debug(f'dropping {schema_name}')
        except OperationalError as e:
            logger.debug(f'operational error')
    logger.debug('exit')
