from sqlalchemy import MetaData, select

from db import constants
from db.columns.defaults import DEFAULT_COLUMNS
from db.tables.operations.split import extract_columns_from_table


def test_extract_columns_from_table_creates_tables(engine_with_roster, roster_table_name, teachers_table_name, roster_no_teachers_table_name, roster_extracted_cols):
    engine, schema = engine_with_roster
    teachers = "Teachers"
    roster_no_teachers = "Roster without Teachers"
    extract_columns_from_table(
        roster_table_name,
        roster_extracted_cols,
        teachers,
        roster_no_teachers,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    t_dict = metadata.tables
    assert (
        f"{schema}.{teachers_table_name}" in t_dict
        and f"{schema}.{roster_no_teachers_table_name}" in t_dict
    )


def test_extract_columns_from_table_sets_up_one_fkey(extracted_remainder_roster):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert len(fkeys) == 1


def test_extract_columns_from_table_sets_correct_reference(extracted_remainder_roster):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert fkeys[0].references(extracted)
    expect_referenced_column = extracted.columns[constants.ID]
    actual_referenced_column = fkeys[0].column
    assert expect_referenced_column == actual_referenced_column


def test_extract_columns_from_table_sets_correct_fkey(extracted_remainder_roster, roster_fkey_col):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    expect_fkey_column = remainder.columns[roster_fkey_col]
    actual_fkey_column = fkeys[0].parent
    assert expect_fkey_column == actual_fkey_column


def test_extract_columns_extracts_correct_columns(extracted_remainder_roster, roster_extracted_cols):
    extracted, remainder, roster, _, _ = extracted_remainder_roster
    expect_extracted_names = sorted(roster_extracted_cols)
    actual_extracted_names = sorted(
        [
            col.name for col in extracted.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    assert expect_extracted_names == actual_extracted_names


def test_extract_columns_leaves_correct_columns(extracted_remainder_roster, roster_extracted_cols, roster_fkey_col):
    extracted, remainder, roster, _, _ = extracted_remainder_roster
    expect_remainder_names = sorted(
        [
            col.name for col in roster.columns
            if col.name not in DEFAULT_COLUMNS
            and col.name not in roster_extracted_cols
        ]
        + [roster_fkey_col]
    )
    actual_remainder_names = sorted(
        [
            col.name for col in remainder.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    assert expect_remainder_names == actual_remainder_names


def test_extract_columns_extracts_correct_data(extracted_remainder_roster, roster_extracted_cols):
    # This test is only valid in combination
    # with test_extract_columns_extracts_columns, since we assume the
    # extracted column list is correct
    extracted, _, roster, engine, _ = extracted_remainder_roster
    expect_tuple_sel = (
        select([roster.columns[name] for name in roster_extracted_cols])
        .distinct()
    )
    actual_tuple_sel = select(
        [extracted.columns[name] for name in roster_extracted_cols]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


def test_extract_columns_leaves_correct_data(extracted_remainder_roster, roster_extracted_cols):
    # This test is only valid in combination
    # with test_extract_columns_leaves_correct_columns, since we assume the
    # remainder column list is correct
    extracted, remainder, roster, engine, _ = extracted_remainder_roster
    remainder_column_names = [
        col.name for col in roster.columns
        if col.name not in DEFAULT_COLUMNS
        and col.name not in roster_extracted_cols
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
