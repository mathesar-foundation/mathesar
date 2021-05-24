import os

import pytest
from sqlalchemy import text

APP_SCHEMA = "test_schema"

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")


@pytest.fixture
def engine_with_schema(engine):
    schema = APP_SCHEMA
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {schema};"))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {schema} CASCADE;"))


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema
