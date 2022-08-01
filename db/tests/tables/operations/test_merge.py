import pytest
from sqlalchemy import MetaData, select

from db.columns.defaults import DEFAULT_COLUMNS
from db.tables.operations.merge import merge_tables


@pytest.mark.skip(reason="Fixture needs to be refactored to return initial column set. "
                         "Splitting a table modifies the original table, so it is not possible to get the initial columns. ")
def test_merge_columns_undoes_extract_columns_ddl_rem_ext(extracted_remainder_roster):
    extracted, remainder, engine, schema = extracted_remainder_roster
    merge_tables(
        remainder.name,
        extracted.name,
        "Merged Roster",
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    merged = metadata.tables[f"{schema}.Merged Roster"]
    expect_merged_names = sorted([col.name for col in remainder.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


@pytest.mark.skip(reason="Fixture needs to be refactored to return initial column set.")
def test_merge_columns_undoes_extract_columns_ddl_ext_rem(extracted_remainder_roster):
    extracted, remainder, engine, schema = extracted_remainder_roster
    merge_tables(
        extracted.name,
        remainder.name,
        "Merged Roster",
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    merged = metadata.tables[f"{schema}.Merged Roster"]
    expect_merged_names = sorted([col.name for col in remainder.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


@pytest.mark.skip(reason="Fixture needs to be refactored to return initial column set.")
def test_merge_columns_returns_original_data_rem_ext(extracted_remainder_roster):
    extracted, remainder, engine, schema = extracted_remainder_roster
    merge_tables(
        remainder.name,
        extracted.name,
        "Merged Roster",
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    roster_columns = sorted(
        [
            col.name for col in remainder.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{schema}.Merged Roster"]
    merged_columns = sorted(
        [
            col.name for col in merged.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    expect_tuple_sel = select(
        [remainder.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


@pytest.mark.skip(reason="Fixture needs to be refactored to return initial column set.")
def test_merge_columns_returns_original_data_ext_rem(extracted_remainder_roster):
    extracted, remainder, engine, schema = extracted_remainder_roster
    merge_tables(
        extracted.name,
        remainder.name,
        "Merged Roster",
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    roster_columns = sorted(
        [
            col.name for col in remainder.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{schema}.Merged Roster"]
    merged_columns = sorted(
        [
            col.name for col in merged.columns
            if col.name not in DEFAULT_COLUMNS
        ]
    )
    expect_tuple_sel = select(
        [remainder.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)
