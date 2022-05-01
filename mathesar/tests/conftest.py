"""
This inherits the fixtures in the root conftest.py
"""
import pytest

from django.core.files import File

from sqlalchemy import Column, MetaData, Integer
from sqlalchemy import Table as SATable

from db.schemas.operations.drop import drop_schema as drop_sa_schema
from db.schemas.operations.create import create_schema as create_sa_schema
from db.schemas.utils import get_schema_oid_from_name, get_schema_name_from_oid
from db.tables.operations.select import get_oid_from_table

from mathesar.models import Schema, Table, Database, DataFile
from mathesar.imports.csv import create_table_from_csv
from db.columns.operations.select import get_column_attnum_from_name
from mathesar.models import Column as mathesar_model_column


@pytest.fixture(scope="session", autouse=True)
def django_db_setup(request, django_db_blocker):
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

    def teardown_database():
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
def patents_csv_filepath():
    return 'mathesar/tests/data/patents.csv'


@pytest.fixture(scope='session')
def paste_filename():
    return 'mathesar/tests/data/patents.txt'


@pytest.fixture(scope='session')
def headerless_patents_csv_filepath():
    return 'mathesar/tests/data/headerless_patents.csv'


@pytest.fixture(scope='session')
def patents_url():
    return 'https://thisisafakeurl.com'


@pytest.fixture(scope='session')
def patents_url_filename():
    return 'mathesar/tests/data/api_patents.csv'


@pytest.fixture(scope='session')
def data_types_csv_filepath():
    return 'mathesar/tests/data/data_types.csv'


@pytest.fixture(scope='session')
def col_names_with_spaces_csv_filepath():
    return 'mathesar/tests/data/col_names_with_spaces.csv'


@pytest.fixture(scope='session')
def col_headers_empty_csv_filepath():
    return 'mathesar/tests/data/col_headers_empty.csv'


@pytest.fixture(scope='session')
def non_unicode_csv_filepath():
    return 'mathesar/tests/data/non_unicode_files/utf_16_le.csv'


@pytest.fixture
def empty_nasa_table(patent_schema, engine_with_mathesar):
    engine, _ = engine_with_mathesar
    NASA_TABLE = 'NASA Schema List'
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
def patent_schema(create_schema):
    PATENT_SCHEMA = 'Patents'
    yield create_schema(PATENT_SCHEMA)


@pytest.fixture
def create_schema(engine_with_mathesar, test_db_model):
    """
    Creates a schema factory, making sure to track and clean up new instances
    """
    engine, _ = engine_with_mathesar
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
        drop_sa_schema(schema, engine, cascade=True, if_exists=True)


@pytest.fixture
def create_patents_table(patents_csv_filepath, patent_schema, create_table):
    schema_name = patent_schema.name
    csv_filepath = patents_csv_filepath

    def _create_table(table_name, schema_name=schema_name):
        return create_table(
            table_name=table_name,
            schema_name=schema_name,
            csv_filepath=csv_filepath,
        )

    return _create_table


@pytest.fixture
def create_table(create_schema):
    def _create_table(table_name, schema_name, csv_filepath):
        data_file = _get_datafile_for_path(csv_filepath)
        schema_model = create_schema(schema_name)
        return create_table_from_csv(data_file, table_name, schema_model)
    return _create_table


def _get_datafile_for_path(path):
    with open(path, 'rb') as file:
        datafile = DataFile.objects.create(file=File(file))
        return datafile


@pytest.fixture
def create_column():
    def _create_column(table, column_data):
        column = table.add_column(column_data)
        attnum = get_column_attnum_from_name(table.oid, [column.name], table.schema._sa_engine)
        column = mathesar_model_column.current_objects.get_or_create(attnum=attnum, table=table)
        return column[0]
    return _create_column


@pytest.fixture
def custom_types_schema_url(schema, live_server):
    return f"{live_server}/{schema.database.name}/{schema.id}"
