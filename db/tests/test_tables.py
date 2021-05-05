import os
import pytest
from sqlalchemy import text, MetaData, select
from db import tables, constants, columns

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
ROSTER_SQL = os.path.join(RESOURCES, "roster_create.sql")
ROSTER = "Roster"
TEACHERS = "Teachers"
ROSTER_NO_TEACHERS = "Roster without Teachers"
APP_SCHEMA = "test_schema"
EXTRACTED_COLS = ["Teacher", "Teacher Email"]
FKEY_COL = f"{TEACHERS}_{constants.ID}"


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
def extracted_remainder_roster(engine_with_roster):
    engine = engine_with_roster
    tables.extract_columns_from_table(
        ROSTER,
        EXTRACTED_COLS,
        TEACHERS,
        ROSTER_NO_TEACHERS,
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    teachers = metadata.tables[f"{APP_SCHEMA}.{TEACHERS}"]
    roster_no_teachers = metadata.tables[f"{APP_SCHEMA}.{ROSTER_NO_TEACHERS}"]
    roster = metadata.tables[f"{APP_SCHEMA}.{ROSTER}"]
    return teachers, roster_no_teachers, roster, engine


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
        EXTRACTED_COLS,
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


def test_extract_columns_from_table_sets_up_one_fkey(
        extracted_remainder_roster,
):
    extracted, remainder, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert len(fkeys) == 1


def test_extract_columns_from_table_sets_correct_reference(
        extracted_remainder_roster,
):
    extracted, remainder, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert fkeys[0].references(extracted)
    expect_referenced_column = extracted.columns[constants.ID]
    actual_referenced_column = fkeys[0].column
    assert expect_referenced_column == actual_referenced_column


def test_extract_columns_from_table_sets_correct_fkey(
        extracted_remainder_roster
):
    extracted, remainder, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    expect_fkey_column = remainder.columns[FKEY_COL]
    actual_fkey_column = fkeys[0].parent
    assert expect_fkey_column == actual_fkey_column


def test_extract_columns_extracts_correct_columns(extracted_remainder_roster):
    extracted, remainder, roster, _ = extracted_remainder_roster
    expect_extracted_names = sorted(EXTRACTED_COLS)
    actual_extracted_names = sorted(
        [
            col.name for col in extracted.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    assert expect_extracted_names == actual_extracted_names


def test_extract_columns_leaves_correct_columns(extracted_remainder_roster):
    extracted, remainder, roster, _ = extracted_remainder_roster
    expect_remainder_names = sorted(
        [
            col.name for col in roster.columns
            if col.name not in columns.DEFAULT_COLUMNS
            and col.name not in EXTRACTED_COLS
        ]
        + [FKEY_COL]
    )
    actual_remainder_names = sorted(
        [
            col.name for col in remainder.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    assert expect_remainder_names == actual_remainder_names


def test_extract_columns_extracts_correct_data(extracted_remainder_roster):
    # This test is only valid in combination
    # with test_extract_columns_extracts_columns, since we assume the
    # extracted column list is correct
    extracted, _, roster, engine = extracted_remainder_roster
    expect_tuple_sel = (
        select([roster.columns[name] for name in EXTRACTED_COLS])
        .distinct()
    )
    actual_tuple_sel = select(
        [extracted.columns[name] for name in EXTRACTED_COLS]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


def test_extract_columns_leaves_correct_data(extracted_remainder_roster):
    # This test is only valid in combination
    # with test_extract_columns_leaves_correct_columns, since we assume the
    # remainder column list is correct
    extracted, remainder, roster, engine = extracted_remainder_roster
    remainder_column_names = [
        col.name for col in roster.columns
        if col.name not in columns.DEFAULT_COLUMNS
        and col.name not in EXTRACTED_COLS
    ]
    expect_tuple_sel = select(
        [roster.columns[name] for name in remainder_column_names]
    )
    actual_tuple_sel = select(
        [remainder.columns[name] for name in remainder_column_names]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


def test_merge_columns_undoes_extract_columns_ddl_rem_ext(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine = extracted_remainder_roster
    tables.merge_tables(
        remainder.name,
        extracted.name,
        "Merged Roster",
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    merged = metadata.tables[f"{APP_SCHEMA}.Merged Roster"]
    expect_merged_names = sorted([col.name for col in roster.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


def test_merge_columns_undoes_extract_columns_ddl_ext_rem(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine = extracted_remainder_roster
    tables.merge_tables(
        extracted.name,
        remainder.name,
        "Merged Roster",
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    merged = metadata.tables[f"{APP_SCHEMA}.Merged Roster"]
    expect_merged_names = sorted([col.name for col in roster.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


def test_merge_columns_returns_original_data_rem_ext(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine = extracted_remainder_roster
    tables.merge_tables(
        remainder.name,
        extracted.name,
        "Merged Roster",
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    roster_columns = sorted(
        [
            col.name for col in roster.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{APP_SCHEMA}.Merged Roster"]
    merged_columns = sorted(
        [
            col.name for col in merged.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    expect_tuple_sel = select(
        [roster.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


def test_merge_columns_returns_original_data_ext_rem(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine = extracted_remainder_roster
    tables.merge_tables(
        extracted.name,
        remainder.name,
        "Merged Roster",
        APP_SCHEMA,
        engine,
    )
    metadata = MetaData(bind=engine, schema=APP_SCHEMA)
    metadata.reflect()
    roster_columns = sorted(
        [
            col.name for col in roster.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{APP_SCHEMA}.Merged Roster"]
    merged_columns = sorted(
        [
            col.name for col in merged.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    expect_tuple_sel = select(
        [roster.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)
