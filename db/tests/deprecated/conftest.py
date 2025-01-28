import os

import pytest
from sqlalchemy import MetaData, text, Table

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
TIMES_SQL = os.path.join(RESOURCES, "times_create.sql")
BOOLEANS_SQL = os.path.join(RESOURCES, "booleans_create.sql")
FILTER_SORT_SQL = os.path.join(RESOURCES, "filter_sort_create.sql")
ARRAY_SQL = os.path.join(RESOURCES, "array_create.sql")
JSON_SQL = os.path.join(RESOURCES, "json_sort.sql")


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_times(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(TIMES_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_array(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ARRAY_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_json(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(JSON_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_booleans(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(BOOLEANS_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


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
def array_table_name():
    return "array_test"


@pytest.fixture(scope='session')
def json_table_name():
    return "json_sort"


@pytest.fixture
def times_table_obj(engine_with_times):
    engine, schema = engine_with_times
    metadata = MetaData(bind=engine)
    table = Table("times", metadata, schema=schema, autoload_with=engine)
    return table, engine


@pytest.fixture
def boolean_table_obj(engine_with_booleans):
    engine, schema = engine_with_booleans
    metadata = MetaData(bind=engine)
    table = Table("boolean", metadata, schema=schema, autoload_with=engine)
    return table, engine


@pytest.fixture
def roster_table_obj(engine_with_roster, roster_table_name):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    table = Table(roster_table_name, metadata, schema=schema, autoload_with=engine)
    return table, engine


@pytest.fixture
def array_table_obj(engine_with_array, array_table_name):
    engine, schema = engine_with_array
    metadata = MetaData(bind=engine)
    table = Table(array_table_name, metadata, schema=schema, autoload_with=engine)
    return table, engine


@pytest.fixture
def json_table_obj(engine_with_json, json_table_name):
    engine, schema = engine_with_json
    metadata = MetaData(bind=engine)
    table = Table(json_table_name, metadata, schema=schema, autoload_with=engine)
    return table, engine
