from sqlalchemy import MetaData, select

from db.columns.defaults import DEFAULT_COLUMNS
from db.tables.operations.merge import merge_tables


def test_merge_columns_undoes_extract_columns_ddl_rem_ext(extracted_remainder_roster):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
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
    expect_merged_names = sorted([col.name for col in roster.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


def test_merge_columns_undoes_extract_columns_ddl_ext_rem(extracted_remainder_roster):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
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
    expect_merged_names = sorted([col.name for col in roster.columns])
    actual_merged_names = sorted([col.name for col in merged.columns])
    assert expect_merged_names == actual_merged_names


def test_merge_columns_returns_original_data_rem_ext(extracted_remainder_roster):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
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
            col.name for col in roster.columns
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
        [roster.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


def test_merge_columns_returns_original_data_ext_rem(extracted_remainder_roster):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
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
            col.name for col in roster.columns
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
        [roster.columns[name] for name in roster_columns]
    )
    actual_tuple_sel = select(
        [merged.columns[name] for name in merged_columns]
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)
