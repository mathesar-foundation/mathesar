import pytest
import random
import string
import os

# These imports come from the mathesar namespace, because our DB setup logic depends on it.
from django.db import connection as dj_connection

from sqlalchemy import MetaData, text, Table
from sqlalchemy.exc import OperationalError, ProgrammingError

from db.credentials import DbCredentials
from db.metadata import get_empty_metadata
from db.engine import add_custom_types_to_ischema_names, create_future_engine
from db.types import install
from db.sql import install as sql_install
from db.schemas.operations.drop import drop_schema as drop_sa_schema
from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_oid_from_name, get_schema_name_from_oid

from fixtures.utils import create_scoped_fixtures


# TODO BUG engine cache uses db_names to key databases: might cause problems at
# some point: better to index using DbCredentials
def engine_cache(request):
    db_names_to_engines = {}
    def _get(db_name):
        engine = db_names_to_engines.get(db_name)
        if engine is None:
            engine = _create_engine(db_name)
            db_names_to_engines[db_name] = engine
        return engine
    yield _get
    for db_name, engine in db_names_to_engines.items():
        engine.dispose()


# defines:
# FUN_engine_cache
# CLA_engine_cache
# MOD_engine_cache
# SES_engine_cache
create_scoped_fixtures(globals(), engine_cache)


def create_db(request, SES_engine_cache):
    """
    A factory for Postgres mathesar-installed databases. A fixture made of this method tears down
    created dbs when leaving scope.

    This method is used to create fixtures with different scopes, that's why it's not a fixture
    itself.
    """
    engine_cache = SES_engine_cache

    import logging
    logger = logging.getLogger(f'create_db-{request.scope}')
    logger.debug('enter')

    created_dbs = set()

    def __create_db(db_name):
        engine = engine_cache(db_name)
        if _database_exists(engine):
            logger.debug(f'dropping preexisting {db_name}')
            _drop_database(engine, engine_cache)
        logger.debug(f'creating {db_name}')
        _create_database(engine, engine_cache)
        created_dbs.add(db_name)
        sql_install.install(engine)
        install.install_mathesar_on_database(engine)
        return db_name
    yield __create_db
    logger.debug('about to clean up')
    for db_name in created_dbs:
        engine = engine_cache(db_name)
        if _database_exists(engine):
            logger.debug(f'dropping {db_name}')
            _drop_database(engine, engine_cache)
        else:
            logger.debug(f'{db_name} already gone')
    logger.debug('exit')


# defines:
# FUN_create_db
# CLA_create_db
# MOD_create_db
# SES_create_db
create_scoped_fixtures(globals(), create_db)


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
    db_name = f"mathesar_db_test_{worker_id}"
    create_db = SES_create_db
    create_db(db_name)
    yield db_name


@pytest.fixture(autouse=True)
def test_db_resurrector(SES_create_db, engine, test_db_name):
    """
    If test_db gets dropped during a previous test, this will recreate it
    during setup.

    The reason to have this is that sometimes test_db gets dropped
    during a test, but most tests presume that this db is always available. As
    of time of writing, that's only happening in `test_database_api.py`.
    """
    db_name = engine.url.database
    if not _database_exists(engine):
        create_db = SES_create_db
        create_db(db_name)


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
        if schema_mustnt_exist:
            assert schema_name not in created_schemas
        logger.debug(f'creating {schema_name}')
        create_sa_schema(schema_name, engine, if_not_exists=True)
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
            logger.debug(f'ignoring operational error: {e}')
    logger.debug('exit')


def _get_root_credentials():
    dj_connection_settings = dj_connection.settings_dict
    return DbCredentials(
        username=dj_connection_settings["USER"],
        password=dj_connection_settings["PASSWORD"],
        hostname=dj_connection_settings["HOST"],
        db_name='postgres',
        port=dj_connection_settings["PORT"],
    )


@pytest.fixture
def root_credentials():
    return _get_root_credentials()


def _create_engine(db_name):
    # Use root_credentials, but with a different db_name
    credentials = _get_root_credentials()._replace(db_name=db_name)
    engine = create_future_engine(
        credentials,
        # Setting a fixed timezone makes the timezone aware test cases predictable.
        connect_args={"options": "-c timezone=utc -c lc_monetary=en_US.UTF-8"}
    )
    return engine


def _get_connection_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"


FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "db", "tests", "resources")
ACADEMICS_SQL = os.path.join(RESOURCES, "academics_create.sql")
LIBRARY_SQL = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_CHECKOUTS_SQL = os.path.join(RESOURCES, "library_add_checkouts.sql")
FRAUDULENT_PAYMENTS_SQL = os.path.join(RESOURCES, "fraudulent_payments.sql")
PLAYER_PROFILES_SQL = os.path.join(RESOURCES, "player_profiles.sql")
MARATHON_ATHLETES_SQL = os.path.join(RESOURCES, "marathon_athletes.sql")


@pytest.fixture
def engine_with_academics(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ACADEMICS_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def academics_db_tables(engine_with_academics):
    def make_table(table_name):
        return Table(
            table_name,
            metadata,
            schema=schema,
            autoload_with=engine,
        )
    engine, schema = engine_with_academics
    metadata = MetaData(bind=engine)
    table_names = {
        'academics',
        'articles',
        'journals',
        'publishers',
        'universities',
    }
    return {
        table_name: make_table(table_name)
        for table_name
        in table_names
    }


@pytest.fixture
def engine_with_library(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(LIBRARY_SQL) as f1, open(LIBRARY_CHECKOUTS_SQL) as f2:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f1.read()))
        conn.execute(text(f2.read()))
    yield engine, schema


@pytest.fixture
def library_db_tables(engine_with_library):
    def make_table(table_name):
        return Table(
            table_name,
            metadata,
            schema=schema,
            autoload_with=engine,
        )
    engine, schema = engine_with_library
    metadata = get_empty_metadata()
    table_names = {
        "Authors",
        "Checkouts",
        "Items",
        "Patrons",
        "Publications",
        "Publishers",
    }
    tables = {
        table_name: make_table(table_name)
        for table_name
        in table_names
    }
    return tables


@pytest.fixture
def engine_with_fraudulent_payment(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(FRAUDULENT_PAYMENTS_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def payments_db_table(engine_with_fraudulent_payment):
    engine, schema = engine_with_fraudulent_payment
    metadata = MetaData(bind=engine)
    table = Table("Payments", metadata, schema=schema, autoload_with=engine)
    return table


@pytest.fixture
def engine_with_player_profiles(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(PLAYER_PROFILES_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def players_db_table(engine_with_player_profiles):
    engine, schema = engine_with_player_profiles
    metadata = MetaData(bind=engine)
    table = Table("Players", metadata, schema=schema, autoload_with=engine)
    return table


@pytest.fixture
def engine_with_marathon_athletes(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(MARATHON_ATHLETES_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def athletes_db_table(engine_with_marathon_athletes):
    engine, schema = engine_with_marathon_athletes
    metadata = MetaData(bind=engine)
    table = Table("Marathon", metadata, schema=schema, autoload_with=engine)
    return table


def _database_exists(engine):
    """
    Returns true if database is connectable and executing a rudimentary query
    succeeds.

    Clone of analogous function in sqlalchemy_utils, but doesn't spawn new
    engines.
    """
    try:
        with engine.connect().execution_options(
            isolation_level="AUTOCOMMIT"
        ) as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        return True
    except (ProgrammingError, OperationalError):
        return False


def _drop_database(engine, engine_cache):
    """
    Drops given database identified by `engine`.

    `engine_cache` used to prevent spawning redundant "root" engines.

    Clone of analogous function in sqlalchemy_utils, but doesn't spawn new
    engines.
    """
    db_name = engine.url.database
    root_engine = engine_cache('postgres')
    # Have to kill connections to db before dropping it
    disconnect_query = f"""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '{db_name}'
        AND pid <> pg_backend_pid();
    """
    with root_engine.connect().execution_options(
        isolation_level="AUTOCOMMIT"
    ) as conn:
        conn.execute(text(disconnect_query))
        conn.execute(text(f'DROP DATABASE "{db_name}"'))
    # If dispose not called, later this engine struggles to reconnect
    engine.dispose()


def _create_database(engine, engine_cache):
    """
    Creates given database identified by `engine`.

    `engine_cache` used to prevent spawning redundant "root" engines.

    Clone of analogous function in sqlalchemy_utils, but doesn't spawn new
    engines.
    """
    db_name = engine.url.database
    root_engine = engine_cache('postgres')
    with root_engine.connect().execution_options(
        isolation_level="AUTOCOMMIT"
    ) as conn:
        conn.execute(text(f'CREATE DATABASE "{db_name}"'))
        conn.commit()
