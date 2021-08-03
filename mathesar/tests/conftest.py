"""
This inherits the fixtures in the root conftest.py
"""
from unittest.mock import patch

import pytest

from mathesar.models import Database


@pytest.fixture(scope="session")
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
def test_db_model(test_db_name, django_db_blocker, django_db_setup):
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
    return 'https://data.nasa.gov/resource/gquh-watm.csv'


@pytest.fixture(scope='session')
def patents_url_file():
    return 'mathesar/tests/data/api_patents.csv'


@pytest.fixture(scope='session')
def patents_url_data(patents_url_file):
    with open(patents_url_file, 'r') as f:
        return f.read()


@pytest.fixture
def mock_patents_url(patents_url_data):
    mock_get_patcher = patch('requests.get')
    mock_get = mock_get_patcher.start()

    data = bytes(patents_url_data, 'utf-8')
    mock_get.return_value.__enter__.return_value.iter_content.return_value = [data]
    mock_get.return_value.__enter__.return_value.ok = True
    mock_get.return_value.__enter__.return_value.headers = {
        'content-type': 'text/csv',
        'content-length': None
    }

    yield mock_get

    mock_get.stop()
