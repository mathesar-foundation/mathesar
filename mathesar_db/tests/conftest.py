"""
This file should provide utilities for setting up test DBs and the like.  It's
intended to be the containment zone for anything specific about the testing
environment (e.g., the login info for the Postgres instance for testing)
"""
import pytest
from sqlalchemy import create_engine, text
from config.settings import DATABASES
from mathesar_db.engine import create_engine_with_custom_types

TEST_DB = "mathesar_db_test_database"

@pytest.fixture(scope="session")
def engine():
    superuser_engine = _get_superuser_engine()
    with superuser_engine.connect() as conn:
        conn.execute(text("COMMIT"))
        conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {TEST_DB}"))
    yield create_engine(
        _get_connection_string(
            DATABASES["default"]["USER"],
            DATABASES["default"]["PASSWORD"],
            DATABASES["default"]["HOST"],
            TEST_DB,
        ),
        future=True,
    )
    with superuser_engine.connect() as conn:
        conn.execute(text("COMMIT"))
        conn.execute(text(f"DROP DATABASE {TEST_DB} WITH (FORCE)"))


def _get_superuser_engine():
    return create_engine(
        _get_connection_string(
            username=DATABASES["default"]["USER"],
            password=DATABASES["default"]["PASSWORD"],
            hostname=DATABASES["default"]["HOST"],
            database=DATABASES["default"]["NAME"],
        ),
        future=True,
    )


def _get_connection_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"
