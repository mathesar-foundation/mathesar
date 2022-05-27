"""
TODO
"""

# These imports come from the mathesar namespace, because our DB setup logic depends on it.
from django.db import connection as dj_connection

# TODO fix this weird shadowing
from db.engine import create_engine as ll_create_engine

from db.types import install

from sqlalchemy_utils import database_exists, create_database, drop_database

from testing.utils import get_fixture_value
from testing import impls


def engine_cache(request):
    import logging
    logger = logging.getLogger(f'engine_cache-{request.scope}')
    logger.debug('enter')
    db_names_to_engines = {}
    def _get(db_name):
        engine = db_names_to_engines.get(db_name)
        logger.debug(f'getting engine for {db_name}')
        if engine is None:
            logger.debug(f'creating engine for {db_name}')
            engine = _create_engine(db_name)
            db_names_to_engines[db_name] = engine
        return engine
    yield _get
    for db_name, engine in db_names_to_engines.items():
        logger.debug(f'cleaning up engine for {db_name}')
        engine.dispose()
    logger.debug('exit')


def create_db(request, SES_engine_cache):
    """
    A factory for Postgres mathesar-installed databases. A fixture made of this method tears down
    created dbs when leaving scope.

    This method is used to create two fixtures with different scopes, that's why it's not a fixture
    itself.
    """
    engine_cache = SES_engine_cache #get_fixture_value(request, impls.engine_cache)

    import logging
    logger = logging.getLogger(f'create_db-{request.scope}')
    logger.debug('enter')

    created_dbs = set()

    def __create_db(db_name):
        engine = engine_cache(db_name)
        if database_exists(engine.url):
            logger.debug(f'dropping preexisting {db_name}')
            drop_database(engine.url)
        logger.debug(f'creating {db_name}')
        create_database(engine.url)
        created_dbs.add(db_name)
        # Our default testing database has our types and functions preinstalled.
        install.install_mathesar_on_database(engine)
        engine.dispose()
        return db_name
    yield __create_db
    logger.debug(f'about to clean up')
    for db_name in created_dbs:
        engine = engine_cache(db_name)
        if database_exists(engine.url):
            logger.debug(f'dropping {db_name}')
            drop_database(engine.url)
        else:
            logger.debug(f'{db_name} already gone')
    logger.debug('exit')


# Seems to be roughly equivalent to mathesar/database/base.py::create_mathesar_engine
# TODO consider fixing this seeming duplication
# either way, both depend on Django configuration. can that be resolved?
def _create_engine(db_name):
    dj_connection_settings = dj_connection.settings_dict
    engine = ll_create_engine(
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


def _get_connection_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"
