"""
This inherits the fixtures in the root conftest.py
"""

import pytest
from config.settings import DATABASES


TEST_DB = 'mathesar_db_test_database'


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture(autouse=True)
def add_test_db_to_databases(settings):
    databases = DATABASES
    databases[TEST_DB] = {
        'USER': DATABASES['default']['USER'],
        'PASSWORD': DATABASES['default']['PASSWORD'],
        'HOST': DATABASES['default']['HOST'],
        'PORT': DATABASES['default']['PORT'],
        'NAME': TEST_DB
    }
    settings.DATABASES = databases
