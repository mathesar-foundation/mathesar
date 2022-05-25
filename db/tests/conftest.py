import os

import pytest
from sqlalchemy import MetaData, text, Table
from sqlalchemy.schema import DropSchema

from db import constants, types
from db.tables.operations.split import extract_columns_from_table
from db.engine import _add_custom_types_to_engine
from db.types import base, install


APP_SCHEMA = "test_schema"

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
def engine_with_schema(engine):
    schema = APP_SCHEMA
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {schema};"))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {schema} CASCADE;"))


# TODO tech debt: notice that below fixtures are very similar


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def engine_with_relation(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(RELATION_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def engine_with_uris(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(URIS_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def engine_with_times(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(TIMES_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def engine_with_booleans(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(BOOLEANS_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


@pytest.fixture
def engine_with_filter_sort(engine_with_schema):
    engine, schema = engine_with_schema
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
    with engine.begin() as conn, open(FILTER_SORT_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema


@pytest.fixture
def engine_with_magnitude(engine_with_schema):
    engine, schema = engine_with_schema
    _add_custom_types_to_engine(engine)
    install.install_mathesar_on_database(engine)
    with engine.begin() as conn, open(MAGNITUDE_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    yield engine, schema
    with engine.begin() as conn:
        conn.execute(DropSchema(base.SCHEMA, cascade=True, if_exists=True))


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
