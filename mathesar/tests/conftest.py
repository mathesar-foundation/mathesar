"""
This inherits the fixtures in the root conftest.py
"""
import pytest
import responses
from copy import deepcopy

from django.conf import settings
from rest_framework.test import APIClient

from mathesar.models.users import User

from fixtures.utils import create_scoped_fixtures


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


@pytest.fixture(scope="session", autouse=True)
def ignore_all_dbs_except_default(SES_dj_databases):
    """
    Ignore the default test database: we're creating and tearing down our own databases dynamically.
    """
    entry_name_to_keep = "default"
    for entry_name in set(SES_dj_databases.keys()):
        if entry_name != entry_name_to_keep:
            del SES_dj_databases[entry_name]


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
def patents_url():
    return 'https://thisisafakeurl.com'


@pytest.fixture(scope='session')
def patents_url_filename():
    return 'mathesar/tests/data/api_patents.csv'


@pytest.fixture(scope='session')
def non_unicode_csv_filepath():
    return 'mathesar/tests/data/non_unicode_files/utf_16_le.csv'


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
