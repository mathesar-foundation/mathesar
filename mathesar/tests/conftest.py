"""
This inherits the fixtures in the root conftest.py
"""
import pytest
from copy import deepcopy

from django.core.files import File
from django.core.cache import cache
from django.conf import settings

from sqlalchemy import Column, MetaData, Integer
from sqlalchemy import Table as SATable

from db.tables.operations.select import get_oid_from_table
from db.tables.operations.create import create_mathesar_table as actual_create_mathesar_table
from db.columns.operations.select import get_column_attnum_from_name
from db.schemas.utils import get_schema_oid_from_name

from mathesar.models import Schema, Table, Database, DataFile
from mathesar.imports.csv import create_table_from_csv
from mathesar.models import Column as mathesar_model_column


def _dj_databases():
    """
    Returns django.conf.settings.DATABASES by reference. During cleanup, restores it to the state
    it was when returned.
    """
    dj_databases_deep_copy = deepcopy(settings.DATABASES)
    yield settings.DATABASES

    settings.DATABASES = dj_databases_deep_copy


dj_databases = pytest.fixture(_dj_databases, scope="function", autouse=True)
dj_module_databases = pytest.fixture(_dj_databases, scope="module", autouse=True)
dj_session_databases = pytest.fixture(_dj_databases, scope="session")


@pytest.fixture(scope="session", autouse=True)
def ignore_all_dbs_except_default(dj_session_databases):
    """
    Ignore the default test database: we're creating and tearing down our own databases dynamically.
    """
    entry_name_to_keep = "default"
    for entry_name in set(dj_session_databases.keys()):
        if entry_name != entry_name_to_keep:
            del dj_session_databases[entry_name]


@pytest.fixture(autouse=True)
def automatically_clear_cache():
    """
    Makes sure Django cache is cleared before every test.
    """
    cache.clear()
    yield


@pytest.fixture(scope="session")
def django_db_modify_db_settings(ignore_all_dbs_except_default, django_db_modify_db_settings):  # noqa: F841
    return


@pytest.fixture(scope="function", autouse=True)
def test_db_model(add_temp_db_to_dj_settings, test_db_name, django_db_blocker):
    add_temp_db_to_dj_settings(test_db_name)
    with django_db_blocker.unblock():
        database_model = Database.current_objects.create(name=test_db_name)
    return database_model


def _add_db_to_dj_settings():
    """
    If the Django layer should be aware of a db, it should be added to settings.DATABASES dict.
    """
    added_dbs = set()

    def _add(db_name):
        dj_databases = settings.DATABASES
        reference_entry = dj_databases["default"]
        new_entry = dict(
            USER=reference_entry['USER'],
            PASSWORD=reference_entry['PASSWORD'],
            HOST=reference_entry['HOST'],
            PORT=reference_entry['PORT'],
            NAME=db_name,
        )
        dj_databases[db_name] = new_entry
        cache.clear()
        added_dbs.add(db_name)
        return db_name
    yield _add


add_temp_db_to_dj_settings = pytest.fixture(_add_db_to_dj_settings, scope="function")


add_module_db_to_dj_settings = pytest.fixture(_add_db_to_dj_settings, scope="module")


# TODO consider renaming dj_db to target_db
@pytest.fixture
def create_temp_dj_db(add_temp_db_to_dj_settings, create_temp_db):
    """
    Like create_temp_db, but adds the new db to Django's settings.DATABASES dict.
    """
    def _create_and_add(db_name):
        create_temp_db(db_name)
        add_temp_db_to_dj_settings(db_name)
        return db_name
    yield _create_and_add


@pytest.fixture(scope="module")
def create_module_dj_db(add_module_db_to_dj_settings, create_module_db):
    """
    Like create_module_db, but adds the new db to Django's settings.DATABASES dict.
    """
    def _create_and_add(db_name):
        create_module_db(db_name)
        add_module_db_to_dj_settings(db_name)
        return db_name
    yield _create_and_add


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
def empty_nasa_table(patent_schema, engine_with_schema):
    engine, _ = engine_with_schema
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
def create_schema(test_db_model, create_db_schema):
    """
    Creates a DJ Schema model factory, making sure to track and clean up new instances
    """
    engine = test_db_model._sa_engine

    def _create_schema(schema_name):
        create_db_schema(schema_name, engine)
        schema_oid = get_schema_oid_from_name(schema_name, engine)
        schema_model, _ = Schema.current_objects.get_or_create(oid=schema_oid, database=test_db_model)
        return schema_model
    yield _create_schema
    # NOTE: Schema model is not cleaned up. Maybe invalidate cache?


@pytest.fixture
def create_mathesar_table(create_db_schema):
    def _create_mathesar_table(
        table_name, schema_name, columns, engine, metadata=None,
    ):
        # We use a fixture for schema creation, so that it gets cleaned up.
        create_db_schema(schema_name, engine, schema_mustnt_exist=False)
        return actual_create_mathesar_table(
            name=table_name, schema=schema_name, columns=columns,
            engine=engine, metadata=metadata
        )
    yield _create_mathesar_table


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


@pytest.fixture
def create_column_with_display_options():
    def _create_column(table, column_data):
        column = table.add_column(column_data)
        attnum = get_column_attnum_from_name(table.oid, [column.name], table.schema._sa_engine)
        # passing table object caches sa_columns, missing out any new columns
        # So table.id is passed to get new instance of table.
        column = mathesar_model_column.current_objects.get_or_create(
            attnum=attnum,
            table_id=table.id,
            display_options=column_data.get('display_options', None)
        )
        return column[0]
    return _create_column
