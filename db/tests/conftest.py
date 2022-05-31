import os

import pytest
from sqlalchemy import MetaData, text, Table

from db import constants
from db.tables.operations.split import extract_columns_from_table
from db.tables.operations.select import get_oid_from_table
from db.types.base import MathesarCustomType
from db.columns.operations.alter import alter_column_type

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
RELATION_SQL = os.path.join(RESOURCES, "relation_create.sql")
URIS_SQL = os.path.join(RESOURCES, "uris_create.sql")
TIMES_SQL = os.path.join(RESOURCES, "times_create.sql")
BOOLEANS_SQL = os.path.join(RESOURCES, "booleans_create.sql")
FILTER_SORT_SQL = os.path.join(RESOURCES, "filter_sort_create.sql")
MAGNITUDE_SQL = os.path.join(RESOURCES, "magnitude_testing_create.sql")


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema


@pytest.fixture
def engine_with_relation(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(RELATION_SQL) as f:
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


@pytest.fixture(scope='session')
def roster_table_name():
    return "Roster"


@pytest.fixture(scope='session')
def relation_table_names():
    return "Person", "Subject"


@pytest.fixture(scope='session')
def uris_table_name():
    return "uris"


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
def relation_table_obj(engine_with_relation, relation_table_names):
    engine, schema = engine_with_relation
    metadata = MetaData(bind=engine)
    referent_table = Table(relation_table_names[0], metadata, schema=schema, autoload_with=engine)
    referrer_table = Table(relation_table_names[1], metadata, schema=schema, autoload_with=engine)
    return referent_table, referrer_table, engine


@pytest.fixture
def magnitude_table_obj(engine_with_magnitude, magnitude_table_name):
    engine, schema = engine_with_magnitude
    metadata = MetaData(bind=engine)
    table = Table(magnitude_table_name, metadata, schema=schema, autoload_with=engine)
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
