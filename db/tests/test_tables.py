import os
import pytest
from sqlalchemy import text, MetaData
from db import tables, constants

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
ROSTER_NAME = "Roster"


@pytest.fixture
def engine_with_schema(engine):
    app_schema = "test_schema"
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA {app_schema};"))
    yield engine, app_schema
    with engine.begin() as conn:
        conn.execute(text(f"DROP SCHEMA {app_schema} CASCADE;"))


@pytest.fixture
def engine_with_roster(engine_with_schema):
    engine, schema = engine_with_schema
    with engine.begin() as conn, open(ROSTER_SQL) as f:
        conn.execute(text(f"SET search_path={schema}"))
        conn.execute(text(f.read()))
    return engine, schema


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    columns = []
    engine, schema = engine_with_schema
    t1 = tables.create_mathesar_table("t1", schema, columns, engine)
    t2 = tables.create_mathesar_table("t2", schema, columns, engine)
    assert all(
        [
            c1.name == c2.name and c1 != c2
            for c1, c2 in zip(t1.columns, t2.columns)
        ]
    )


def test_extract_columns_from_table_creates_tables(engine_with_roster):
    engine, schema = engine_with_roster
    teachers = "Teachers"
    roster_no_teachers = "Roster without Teachers"
    tables.extract_columns_from_table(
        "Roster",
        ["Teacher", "Teacher Email"],
        teachers,
        roster_no_teachers,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    t_dict = metadata.tables
    assert (
        f"{schema}.{teachers}" in t_dict
        and f"{schema}.{roster_no_teachers}" in t_dict
    )


def test_extract_columns_from_table_sets_up_one_fkey(engine_with_roster):
    engine, schema = engine_with_roster
    teachers_name = "Teachers"
    roster_no_teachers_name = "Roster without Teachers"
    tables.extract_columns_from_table(
        "Roster",
        ["Teacher", "Teacher Email"],
        teachers_name,
        roster_no_teachers_name,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    roster_no_teachers = metadata.tables[f"{schema}.{roster_no_teachers_name}"]
    fkeys = list(roster_no_teachers.foreign_keys)
    assert len(fkeys) == 1


def test_extract_columns_from_table_sets_correct_reference(engine_with_roster):
    engine, schema = engine_with_roster
    teachers_name = "Teachers"
    roster_no_teachers_name = "Roster without Teachers"
    tables.extract_columns_from_table(
        "Roster",
        ["Teacher", "Teacher Email"],
        teachers_name,
        roster_no_teachers_name,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    teachers = metadata.tables[f"{schema}.{teachers_name}"]
    roster_no_teachers = metadata.tables[f"{schema}.{roster_no_teachers_name}"]
    fkeys = list(roster_no_teachers.foreign_keys)
    assert fkeys[0].references(teachers)
    expect_referenced_column = teachers.columns[constants.ID]
    actual_referenced_column = fkeys[0].column
    assert expect_referenced_column == actual_referenced_column


def test_extract_columns_from_table_sets_correct_fkey(engine_with_roster):
    engine, schema = engine_with_roster
    teachers_name = "Teachers"
    roster_no_teachers_name = "Roster without Teachers"
    tables.extract_columns_from_table(
        "Roster",
        ["Teacher", "Teacher Email"],
        teachers_name,
        roster_no_teachers_name,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    teachers = metadata.tables[f"{schema}.{teachers_name}"]
    roster_no_teachers = metadata.tables[f"{schema}.{roster_no_teachers_name}"]
    fkeys = list(roster_no_teachers.foreign_keys)
    assert fkeys[0].references(teachers)
    expect_fkey_column = roster_no_teachers.columns[
        f"{teachers_name}_{constants.ID}"
    ]
    actual_fkey_column = fkeys[0].parent
    assert expect_fkey_column == actual_fkey_column
