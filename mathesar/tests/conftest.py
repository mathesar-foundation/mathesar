"""
This inherits the fixtures in the root conftest.py
"""

import pytest


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture(scope='session')
def csv_filename():
    return 'mathesar/tests/libraries.csv'
