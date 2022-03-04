"""
This inherits the fixtures in the root conftest.py
"""
import pytest

from django.core.files import File

from sqlalchemy import Column, MetaData, text, Integer
from sqlalchemy import Table as SATable

from db.types import base, install
from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_oid_from_name, get_schema_name_from_oid
from db.tables.operations.select import get_oid_from_table

from mathesar.models import Schema, Table, Database, DataFile
from mathesar.database.base import create_mathesar_engine
from mathesar.imports.csv import create_table_from_csv


PATENT_SCHEMA = 'Patents'
NASA_TABLE = 'NASA Schema List'


@pytest.fixture(scope="session", autouse=True)
def django_db_setup(request, django_db_blocker) -> None:
    """
    A stripped down version of pytest-django's original django_db_setup fixture
    See: https://github.com/pytest-dev/pytest-django/blob/master/pytest_django/fixtures.py#L96
    Also see: https://pytest-django.readthedocs.io/en/latest/database.html#using-a-template-database-for-tests

    Removes most additional options (use migrations, keep / create db, etc.)
    Adds 'aliases' to the call to setup_databases() which restrict Django to only
    building and destroying the default Django db, and not our tables dbs.

    Called by build_test_db_model to setup the django DB before the databse models.
    """
    from django.test.utils import setup_databases, teardown_databases

    with django_db_blocker.unblock():
        db_cfg = setup_databases(
            verbosity=request.config.option.verbose,
            interactive=False,
            aliases=["default"],
        )

    def teardown_database() -> None:
        with django_db_blocker.unblock():
            try:
                teardown_databases(db_cfg, verbosity=request.config.option.verbose)
            except Exception as exc:
                request.node.warn(
                    pytest.PytestWarning(
                        "Error when trying to teardown test databases: %r" % exc
                    )
                )

    request.addfinalizer(teardown_database)


@pytest.fixture(scope="session", autouse=True)
def test_db_model(test_db_name, django_db_blocker):
    with django_db_blocker.unblock():
        database_model = Database.current_objects.create(name=test_db_name)
    return database_model


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture(scope='session')
def csv_filename():
    return 'mathesar/tests/data/patents.csv'


@pytest.fixture(scope='session')
def paste_filename():
    return 'mathesar/tests/data/patents.txt'


@pytest.fixture(scope='session')
def headerless_csv_filename():
    return 'mathesar/tests/data/headerless_patents.csv'


@pytest.fixture(scope='session')
def patents_url():
    return 'https://thisisafakeurl.com'


@pytest.fixture(scope='session')
def patents_url_filename():
    return 'mathesar/tests/data/api_patents.csv'


@pytest.fixture(scope='session')
def data_types_csv_filename():
    return 'mathesar/tests/data/data_types.csv'


@pytest.fixture(scope='session')
def non_unicode_csv_filename():
    return 'mathesar/tests/data/non_unicode_files/utf_16_le.csv'


@pytest.fixture
def create_schema(engine, test_db_model):
    """
    Creates a schema factory, making sure to track and clean up new instances
    """
    function_schemas = {}

    def _create_schema(schema_name):
        if schema_name in function_schemas:
            schema_oid = function_schemas[schema_name]
        else:
            create_sa_schema(schema_name, engine)
            schema_oid = get_schema_oid_from_name(schema_name, engine)
            function_schemas[schema_name] = schema_oid
        schema_model, _ = Schema.current_objects.get_or_create(oid=schema_oid, database=test_db_model)
        return schema_model
    yield _create_schema

    for oid in function_schemas.values():
        # Handle schemas being renamed during test
        schema = get_schema_name_from_oid(oid, engine)
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE;'))


@pytest.fixture
def patent_schema(test_db_model, create_schema):
    engine = create_mathesar_engine(test_db_model.name)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{PATENT_SCHEMA}" CASCADE;'))
    yield create_schema(PATENT_SCHEMA)
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {base.SCHEMA} CASCADE;'))


@pytest.fixture
def empty_nasa_table(patent_schema):
    engine = create_mathesar_engine(patent_schema.database.name)
    db_table = SATable(
        NASA_TABLE, MetaData(bind=engine),
        Column('id', Integer, primary_key=True),
        schema=patent_schema.name,
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.current_objects.create(oid=db_table_oid, schema=patent_schema)

    yield table

    table.delete_sa_table()
    table.delete()


@pytest.fixture
def create_table(csv_filename, create_schema):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))

    def _create_table(table_name, schema='Patents'):
        schema_model = create_schema(schema)
        return create_table_from_csv(data_file, table_name, schema_model)
    return _create_table
