"""
This inherits the fixtures in the root conftest.py
"""
import pytest
import responses
from copy import deepcopy
from unittest.mock import patch

from django.conf import settings
from rest_framework.test import APIClient

from db import connection
from mathesar.models.users import User


@pytest.fixture
def mocked_responses():
    """
    For mocking requests library's responses.

    See https://github.com/getsentry/responses#responses-as-a-pytest-fixture
    """
    with responses.RequestsMock() as rsps:
        yield rsps


@pytest.fixture
def mocked_exec_msar_func():
    """
    Lets you patch the db.connection.exec_msar_func() for testing.
    """
    with patch.object(connection, "exec_msar_func") as mock:
        mock.return_value = mock
        yield mock


@pytest.fixture
def mocked_select_from_msar_func():
    """
    Lets you patch the db.connection.select_from_msar_func() for testing.
    """
    with patch.object(connection, "select_from_msar_func") as mock:
        mock.return_value = mock
        yield mock


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture(scope="session", autouse=True)
def ignore_all_dbs_except_default(dj_databases):
    """
    Ignore the default test database: we're creating and tearing down our own databases dynamically.
    """
    entry_name_to_keep = "default"
    for entry_name in set(dj_databases.keys()):
        if entry_name != entry_name_to_keep:
            del dj_databases[entry_name]


@pytest.fixture(scope="session")
def dj_databases():
    """
    Returns django.conf.settings.DATABASES by reference. During cleanup, restores it to the state
    it was when returned.
    """
    dj_databases_deep_copy = deepcopy(settings.DATABASES)
    yield settings.DATABASES
    settings.DATABASES = dj_databases_deep_copy


@pytest.fixture(scope='session')
def patents_csv_filepath():
    return 'mathesar/tests/data/patents.csv'


@pytest.fixture(scope='session')
def patents_json_filepath():
    return 'mathesar/tests/data/patents.json'


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
def client_alice(user_alice):
    client = APIClient()
    client.login(username=user_alice.username, password='password')
    return client
