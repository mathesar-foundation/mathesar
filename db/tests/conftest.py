import os

import pytest
from sqlalchemy import MetaData, text

from db import constants
from db.tables.operations.split import extract_columns_from_table


APP_SCHEMA = "test_schema"

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
FILTER_SORT_SQL = os.path.join(RESOURCES, "filter_sort_create.sql")


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


@pytest.fixture
def engine_with_filter_sort(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(FILTER_SORT_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema


@pytest.fixture(scope='session')
def roster_table_name():
    return "Roster"


@pytest.fixture(scope='session')
def teachers_table_name():
    return "Teachers"


@pytest.fixture(scope='session')
def roster_no_teachers_table_name():
    return "Roster without Teachers"


@pytest.fixture(scope='session')
def roster_extracted_cols():
    return ["Teacher", "Teacher Email"]


@pytest.fixture(scope='session')
def roster_fkey_col(teachers_table_name):
    return f"{teachers_table_name}_{constants.ID}"


@pytest.fixture
def extracted_remainder_roster(engine_with_roster, roster_table_name, roster_extracted_cols, teachers_table_name, roster_no_teachers_table_name):
    engine, schema = engine_with_roster
    extract_columns_from_table(
        roster_table_name,
        roster_extracted_cols,
        teachers_table_name,
        roster_no_teachers_table_name,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    teachers = metadata.tables[f"{schema}.{teachers_table_name}"]
    roster_no_teachers = metadata.tables[f"{schema}.{roster_no_teachers_table_name}"]
    roster = metadata.tables[f"{schema}.{roster_table_name}"]
    return teachers, roster_no_teachers, roster, engine, schema
