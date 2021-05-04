import os
import pytest
from sqlalchemy import text, MetaData
from db import tables, constants

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
ROSTER = "Roster"
TEACHERS = "Teachers"
ROSTER_NO_TEACHERS = "Roster without Teachers"
APP_SCHEMA = "test_schema"
COL1 = "Teacher"
COL2 = "Teacher Email"


@pytest.fixture
def engine_with_schema(engine):
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {APP_SCHEMA};"))
    yield engine
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {APP_SCHEMA} CASCADE;"))


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={APP_SCHEMA}"))
        conn.execute(text(f.read()))
    return engine


@pytest.fixture
def extracted_teachers(engine_with_roster):
    engine = engine_with_roster
    tables.extract_columns_from_table(
        ROSTER,
        [COL1, COL2],
        TEACHERS,
        ROSTER_NO_TEACHERS,
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    teachers = metadata.tables[f"{APP_SCHEMA}.{TEACHERS}"]
    roster_no_teachers = metadata.tables[f"{APP_SCHEMA}.{ROSTER_NO_TEACHERS}"]
    return teachers, roster_no_teachers


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    columns = []
    engine = engine_with_schema
    t1 = tables.create_mathesar_table("t1", APP_SCHEMA, columns, engine)
    t2 = tables.create_mathesar_table("t2", APP_SCHEMA, columns, engine)
    assert all(
        [
            c1.name == c2.name and c1 != c2
            for c1, c2 in zip(t1.columns, t2.columns)
        ]
    )


def test_extract_columns_from_table_creates_tables(engine_with_roster):
    engine = engine_with_roster
    teachers = "Teachers"
    roster_no_teachers = "Roster without Teachers"
    tables.extract_columns_from_table(
        ROSTER,
        [COL1, COL2],
        teachers,
        roster_no_teachers,
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    t_dict = metadata.tables
    assert (
        f"{APP_SCHEMA}.{TEACHERS}" in t_dict
        and f"{APP_SCHEMA}.{ROSTER_NO_TEACHERS}" in t_dict
    )


def test_extract_columns_from_table_sets_up_one_fkey(extracted_teachers):
    extracted, remainder = extracted_teachers
    fkeys = list(remainder.foreign_keys)
    assert len(fkeys) == 1


def test_extract_columns_from_table_sets_correct_reference(extracted_teachers):
    extracted, remainder = extracted_teachers
    fkeys = list(remainder.foreign_keys)
    assert fkeys[0].references(extracted)
    expect_referenced_column = extracted.columns[constants.ID]
    actual_referenced_column = fkeys[0].column
    assert expect_referenced_column == actual_referenced_column


def test_extract_columns_from_table_sets_correct_fkey(extracted_teachers):
    extracted, remainder = extracted_teachers
    fkeys = list(remainder.foreign_keys)
    expect_fkey_column = remainder.columns[f"{extracted.name}_{constants.ID}"]
    actual_fkey_column = fkeys[0].parent
    assert expect_fkey_column == actual_fkey_column
