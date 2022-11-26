import os

import pytest
from sqlalchemy import MetaData, text, Table

from db import constants
from db.columns.operations.select import get_columns_attnum_from_names
from db.tables.operations.split import extract_columns_from_table
from db.tables.operations.select import get_oid_from_table
from db.types.base import MathesarCustomType
from db.columns.operations.alter import alter_column_type
from db.metadata import get_empty_metadata

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
URIS_SQL = os.path.join(RESOURCES, "uris_create.sql")
TIMES_SQL = os.path.join(RESOURCES, "times_create.sql")
BOOLEANS_SQL = os.path.join(RESOURCES, "booleans_create.sql")
FILTER_SORT_SQL = os.path.join(RESOURCES, "filter_sort_create.sql")
MAGNITUDE_SQL = os.path.join(RESOURCES, "magnitude_testing_create.sql")
ARRAY_SQL = os.path.join(RESOURCES, "array_create.sql")
JSON_SQL = os.path.join(RESOURCES, "json_sort.sql")
BOOKS_FROM_SQL = os.path.join(RESOURCES, "books_import_from.sql")
BOOKS_TARGET_SQL = os.path.join(RESOURCES, "books_import_target.sql")


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_uris(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(URIS_SQL) as f:
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


@pytest.fixture
def engine_with_magnitude(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(MAGNITUDE_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_books_to_import_from(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(BOOKS_FROM_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema


@pytest.fixture
def engine_with_books_import_target(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(BOOKS_TARGET_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema


@pytest.fixture(scope='session')
def roster_table_name():
    return "Roster"


@pytest.fixture(scope='session')
def uris_table_name():
    return "uris"


@pytest.fixture(scope='session')
def array_table_name():
    return "array_test"


@pytest.fixture(scope='session')
def json_table_name():
    return "json_sort"


@pytest.fixture(scope='session')
def magnitude_table_name():
    return "magnitude_testing"


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


@pytest.fixture(scope='session')
def books_import_from_table_name():
    return "books_from"


@pytest.fixture(scope='session')
def books_import_target_table_name():
    return "books_target"


@pytest.fixture
def extracted_remainder_roster(engine_with_roster, roster_table_name, roster_extracted_cols, teachers_table_name):
    engine, schema = engine_with_roster
    roster_table_oid = get_oid_from_table(roster_table_name, schema, engine)
    roster_extracted_col_attnums = get_columns_attnum_from_names(roster_table_oid, roster_extracted_cols, engine, metadata=get_empty_metadata())
    extract_columns_from_table(
        roster_table_oid,
        roster_extracted_col_attnums,
        teachers_table_name,
        schema,
        engine,
    )
    metadata = get_empty_metadata()
    extracted = Table(teachers_table_name, metadata, schema=schema, autoload_with=engine)
    remainder = Table(roster_table_name, metadata, schema=schema, autoload_with=engine)
    return extracted, remainder, engine, schema


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
def magnitude_table_obj(engine_with_magnitude, magnitude_table_name):
    engine, schema = engine_with_magnitude
    metadata = MetaData(bind=engine)
    table = Table(magnitude_table_name, metadata, schema=schema, autoload_with=engine)
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


@pytest.fixture
def uris_table_obj(engine_with_uris, uris_table_name):
    engine, schema = engine_with_uris
    metadata = MetaData(bind=engine)
    table = Table(uris_table_name, metadata, schema=schema, autoload_with=engine)
    # Cast "uri" column from string to URI
    with engine.begin() as conn:
        uri_column_name = "uri"
        uri_type = MathesarCustomType.URI
        alter_column_type(
            get_oid_from_table(table.name, schema, engine),
            uri_column_name,
            engine,
            conn,
            uri_type,
        )
    yield table, engine


@pytest.fixture
def books_table_import_from_obj(engine_with_books_to_import_from, books_import_from_table_name):
    engine, schema = engine_with_books_to_import_from
    metadata = MetaData(bind=engine)
    table = Table(books_import_from_table_name, metadata, schema=schema, autoload_with=engine)
    return table, engine


@pytest.fixture
def books_table_import_target_obj(engine_with_books_import_target, books_import_target_table_name):
    engine, schema = engine_with_books_import_target
    metadata = MetaData(bind=engine)
    table = Table(books_import_target_table_name, metadata, schema=schema, autoload_with=engine)
    return table, engine
