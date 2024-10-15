"""
This inherits the fixtures in the root conftest.py
"""
import pytest
import logging
import responses
from copy import deepcopy

from django.core.files import File
from django.core.cache import cache
from django.conf import settings
from django.db import connection as dj_connection
from rest_framework.test import APIClient

from sqlalchemy import Column, MetaData, Integer, Date
from sqlalchemy import Table as SATable

from db.tables.operations.select import get_oid_from_table
from db.tables.operations.create import create_mathesar_table as actual_create_mathesar_table
from db.columns.operations.select import get_column_attnum_from_name
from db.schemas.utils import get_schema_oid_from_name

import mathesar.tests.conftest
from mathesar.models.base import DataFile
from mathesar.models.users import User

from fixtures.utils import create_scoped_fixtures, get_fixture_value
import conftest
from db.metadata import get_empty_metadata
from db.tests.columns.utils import create_test_table


@pytest.fixture
def mocked_responses():
    """
    For mocking requests library's responses.

    See https://github.com/getsentry/responses#responses-as-a-pytest-fixture
    """
    with responses.RequestsMock() as rsps:
        yield rsps


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture(scope="session")
def django_db_modify_db_settings(
        ignore_all_dbs_except_default,  # noqa: F841
        django_db_modify_db_settings,   # noqa: F841
):
    return


@pytest.fixture(scope="session", autouse=True)
def ignore_all_dbs_except_default(SES_dj_databases):
    """
    Ignore the default test database: we're creating and tearing down our own databases dynamically.
    """
    entry_name_to_keep = "default"
    for entry_name in set(SES_dj_databases.keys()):
        if entry_name != entry_name_to_keep:
            del SES_dj_databases[entry_name]


def add_db_to_dj_settings(request):
    """
    If the Django layer should be aware of a db, it should be added to settings.DATABASES dict.
    """
    dj_databases = get_fixture_value(request, mathesar.tests.conftest.dj_databases)
    added_dbs = set()

    def _add(db_name):
        reference_entry = dj_connection.settings_dict
        dj_databases[db_name] = reference_entry
        dj_databases[db_name]['NAME'] = db_name
        cache.clear()
        added_dbs.add(db_name)
        return db_name
    yield _add


# defines:
# FUN_add_db_to_dj_settings
# CLA_add_db_to_dj_settings
# MOD_add_db_to_dj_settings
# SES_add_db_to_dj_settings
create_scoped_fixtures(globals(), add_db_to_dj_settings)


def dj_databases():
    """
    Returns django.conf.settings.DATABASES by reference. During cleanup, restores it to the state
    it was when returned.
    """
    dj_databases_deep_copy = deepcopy(settings.DATABASES)
    yield settings.DATABASES
    settings.DATABASES = dj_databases_deep_copy


# defines:
# FUN_dj_databases
# CLA_dj_databases
# MOD_dj_databases
# SES_dj_databases
create_scoped_fixtures(globals(), dj_databases)


@pytest.fixture(scope='session')
def patents_csv_filepath():
    return 'mathesar/tests/data/patents.csv'


@pytest.fixture(scope='session')
def patents_json_filepath():
    return 'mathesar/tests/data/patents.json'


@pytest.fixture(scope='session')
def patents_excel_filepath():
    return 'mathesar/tests/data/patents.xlsx'


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
def col_names_with_spaces_csv_filepath():
    return 'mathesar/tests/data/col_names_with_spaces.csv'


@pytest.fixture(scope='session')
def col_headers_empty_csv_filepath():
    return 'mathesar/tests/data/col_headers_empty.csv'


@pytest.fixture(scope='session')
def non_unicode_csv_filepath():
    return 'mathesar/tests/data/non_unicode_files/utf_16_le.csv'


@pytest.fixture(scope='session')
def duplicate_id_table_csv_filepath():
    return 'mathesar/tests/data/csv_parsing/duplicate_id_table.csv'


@pytest.fixture(scope='session')
def null_id_table_csv_filepath():
    return 'mathesar/tests/data/csv_parsing/null_id_table.csv'


@pytest.fixture(scope='session')
def duplicate_id_table_json_filepath():
    return 'mathesar/tests/data/json_parsing/duplicate_id_table.json'


@pytest.fixture(scope='session')
def null_id_table_json_filepath():
    return 'mathesar/tests/data/json_parsing/null_id_table.json'


@pytest.fixture(scope='session')
def duplicate_id_table_excel_filepath():
    return 'mathesar/tests/data/excel_parsing/duplicate_id_table.xlsx'


@pytest.fixture(scope='session')
def null_id_table_excel_filepath():
    return 'mathesar/tests/data/excel_parsing/null_id_table.xlsx'


@pytest.fixture(scope='session')
def multiple_sheets_excel_filepath():
    return 'mathesar/tests/data/excel_parsing/multiple_sheets.xlsx'


# TODO rename to create_mathesar_db_table
@pytest.fixture
def create_mathesar_table(create_db_schema):
    def _create_mathesar_table(
        table_name, schema_name, columns, engine, metadata=None,
    ):
        # We use a fixture for schema creation, so that it gets cleaned up.
        create_db_schema(schema_name, engine, schema_mustnt_exist=False)
        schema_oid = get_schema_oid_from_name(schema_name, engine)
        return actual_create_mathesar_table(
            engine=engine, table_name=table_name, schema_oid=schema_oid, columns=columns,
        )
    yield _create_mathesar_table


def _get_datafile_for_path(path):
    with open(path, 'rb') as file:
        datafile = DataFile.objects.create(file=File(file), type='csv')
        return datafile


@pytest.fixture
def user_alice():
    user = User.objects.create(
        username='alice',
        email='alice@example.com',
        full_name='Alice Jones',
        short_name='Alice'
    )
    user.set_password('password')
    user.save()
    yield user
    user.delete()


@pytest.fixture
def user_bob():
    user = User.objects.create(
        username='bob',
        email='bob@example.com',
        full_name='Bob Smith',
        short_name='Bob'
    )
    user.set_password('password')
    user.save()
    yield user
    user.delete()


@pytest.fixture
def client(admin_user):
    client = APIClient()
    client.login(username='admin', password='password')
    return client


@pytest.fixture
def anonymous_client():
    client = APIClient()
    return client


@pytest.fixture
def client_bob(user_bob):
    client = APIClient()
    client.login(username='bob', password='password')
    return client


@pytest.fixture
def client_alice(user_alice):
    client = APIClient()
    client.login(username=user_alice.username, password='password')
    return client


@pytest.fixture
def user_jerry():
    user = User.objects.create(
        username='jerry',
        email='jerry@example.com',
        full_name='JerrySmith',
        short_name='Jerry'
    )
    user.set_password('password')
    user.save()
    yield user
    user.delete()


@pytest.fixture
def user_turdy():
    user = User.objects.create(
        username='turdy',
        email='turdy@example.com',
        full_name='Turdy',
        short_name='Turdy'
    )
    user.set_password('password')
    user.save()
    yield user
    user.delete()


@pytest.fixture
def user_tom():
    user = User.objects.create(
        username='tom',
        email='tom@example.com',
        full_name='Tom James',
        short_name='Tom'
    )
    user.set_password('password')
    user.save()
    yield user
    user.delete()
