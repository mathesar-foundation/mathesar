from unittest.mock import call, patch
import pytest
from sqlalchemy import MetaData, select, Column, String, Table
from db import tables, constants, columns

ROSTER = "Roster"
TEACHERS = "Teachers"
ROSTER_NO_TEACHERS = "Roster without Teachers"
EXTRACTED_COLS = ["Teacher", "Teacher Email"]
REM_MOVE_COL = ["Subject"]
REM_MOVE_COLS = ["Student Name", "Student Email"]
FKEY_COL = f"{TEACHERS}_{constants.ID}"


@pytest.fixture
def extracted_remainder_roster(engine_with_roster):
    engine, schema = engine_with_roster
    tables.extract_columns_from_table(
        ROSTER,
        EXTRACTED_COLS,
        TEACHERS,
        ROSTER_NO_TEACHERS,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    teachers = metadata.tables[f"{schema}.{TEACHERS}"]
    roster_no_teachers = metadata.tables[f"{schema}.{ROSTER_NO_TEACHERS}"]
    roster = metadata.tables[f"{schema}.{ROSTER}"]
    return teachers, roster_no_teachers, roster, engine, schema


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    t1 = tables.create_mathesar_table("t1", schema, column_list, engine)
    t2 = tables.create_mathesar_table("t2", schema, column_list, engine)
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
        ROSTER,
        EXTRACTED_COLS,
        teachers,
        roster_no_teachers,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    t_dict = metadata.tables
    assert (
        f"{schema}.{TEACHERS}" in t_dict
        and f"{schema}.{ROSTER_NO_TEACHERS}" in t_dict
    )


def test_extract_columns_from_table_sets_up_one_fkey(
        extracted_remainder_roster,
):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert len(fkeys) == 1


def test_extract_columns_from_table_sets_correct_reference(
        extracted_remainder_roster,
):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    assert fkeys[0].references(extracted)
    expect_referenced_column = extracted.columns[constants.ID]
    actual_referenced_column = fkeys[0].column
    assert expect_referenced_column == actual_referenced_column


def test_extract_columns_from_table_sets_correct_fkey(
        extracted_remainder_roster
):
    extracted, remainder, _, _, _ = extracted_remainder_roster
    fkeys = list(remainder.foreign_keys)
    expect_fkey_column = remainder.columns[FKEY_COL]
    actual_fkey_column = fkeys[0].parent
    assert expect_fkey_column == actual_fkey_column


def test_extract_columns_extracts_correct_columns(extracted_remainder_roster):
    extracted, remainder, roster, _, _ = extracted_remainder_roster
    expect_extracted_names = sorted(EXTRACTED_COLS)
    actual_extracted_names = sorted(
        [
            col.name for col in extracted.columns
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    assert expect_extracted_names == actual_extracted_names


def test_extract_columns_leaves_correct_columns(extracted_remainder_roster):
    extracted, remainder, roster, _, _ = extracted_remainder_roster
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
    extracted, _, roster, engine, _ = extracted_remainder_roster
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
    extracted, remainder, roster, engine, _ = extracted_remainder_roster
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
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
    tables.merge_tables(
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


def test_merge_columns_undoes_extract_columns_ddl_ext_rem(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
    tables.merge_tables(
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


def test_merge_columns_returns_original_data_rem_ext(
        extracted_remainder_roster
):
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
    tables.merge_tables(
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
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{schema}.Merged Roster"]
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
    extracted, remainder, roster, engine, schema = extracted_remainder_roster
    tables.merge_tables(
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
            if col.name not in columns.DEFAULT_COLUMNS
        ]
    )
    merged = metadata.tables[f"{schema}.Merged Roster"]
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


def test_move_columns_moves_column_from_ext_to_rem(extracted_remainder_roster):
    extracted, remainder, _, engine, schema = extracted_remainder_roster
    moving_col = EXTRACTED_COLS[0]
    extracted_cols = [col.name for col in extracted.columns]
    remainder_cols = [col.name for col in remainder.columns]
    expect_extracted_cols = [
        name for name in extracted_cols if name != moving_col
    ]
    expect_remainder_cols = remainder_cols + [moving_col]
    extracted_name = extracted.name
    remainder_name = remainder.name
    tables.move_columns_between_related_tables(
        extracted_name,
        remainder_name,
        [moving_col],
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    new_extracted = metadata.tables[f"{schema}.{extracted_name}"]
    new_remainder = metadata.tables[f"{schema}.{remainder_name}"]
    actual_extracted_cols = [col.name for col in new_extracted.columns]
    actual_remainder_cols = [col.name for col in new_remainder.columns]
    assert sorted(actual_extracted_cols) == sorted(expect_extracted_cols)
    assert sorted(actual_remainder_cols) == sorted(expect_remainder_cols)


def test_move_columns_moves_column_from_rem_to_ext(extracted_remainder_roster):
    extracted, remainder, _, engine, schema = extracted_remainder_roster
    extracted_cols = [col.name for col in extracted.columns]
    remainder_cols = [col.name for col in remainder.columns]
    moving_col = "Grade"
    expect_remainder_cols = [
        name for name in remainder_cols if name != moving_col
    ]
    expect_extracted_cols = extracted_cols + [moving_col]
    extracted_name = extracted.name
    remainder_name = remainder.name
    tables.move_columns_between_related_tables(
        remainder_name,
        extracted_name,
        [moving_col],
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    new_extracted = metadata.tables[f"{schema}.{extracted_name}"]
    new_remainder = metadata.tables[f"{schema}.{remainder_name}"]
    actual_extracted_cols = [col.name for col in new_extracted.columns]
    actual_remainder_cols = [col.name for col in new_remainder.columns]
    assert sorted(actual_extracted_cols) == sorted(expect_extracted_cols)
    assert sorted(actual_remainder_cols) == sorted(expect_remainder_cols)


def test_get_enriched_column_table(engine):
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = tables.get_enriched_column_table(table, engine=engine)
    assert enriched_table.columns[abc].engine == engine


def test_get_enriched_column_table_no_engine():
    abc = "abc"
    table = Table("testtable", MetaData(), Column(abc, String), Column('def', String))
    enriched_table = tables.get_enriched_column_table(table)
    assert enriched_table.columns[abc].engine is None


def test_infer_table_column_types_doesnt_touch_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    table_name = "t1"
    tables.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(tables.inference, "infer_column_type") as mock_infer:
        tables.update_table_column_types(
            schema,
            table_name,
            engine
        )
    mock_infer.assert_not_called()


def test_update_table_column_types_infers_non_default_types(engine_with_schema):
    col1 = Column("col1", String)
    col2 = Column("col2", String)
    column_list = [col1, col2]
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    tables.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(tables.inference, "infer_column_type") as mock_infer:
        tables.update_table_column_types(
            schema,
            table_name,
            engine
        )
    expect_calls = [
        call(
            schema,
            table_name,
            col1.name,
            engine,
        ),
        call(
            schema,
            table_name,
            col2.name,
            engine,
        ),
    ]
    mock_infer.assert_has_calls(expect_calls)


def test_update_table_column_types_skips_pkey_columns(engine_with_schema):
    column_list = [Column("checkcol", String, primary_key=True)]
    engine, schema = engine_with_schema
    table_name = "t1"
    tables.create_mathesar_table(
        table_name, schema, column_list, engine
    )
    with patch.object(tables.inference, "infer_column_type") as mock_infer:
        tables.update_table_column_types(
            schema,
            table_name,
            engine
        )
    mock_infer.assert_not_called()


def test_update_table_column_types_skips_fkey_columns(
        extracted_remainder_roster
):
    _, remainder, _, engine, schema = extracted_remainder_roster
    with patch.object(tables.inference, "infer_column_type") as mock_infer:
        tables.update_table_column_types(
            schema,
            remainder.name,
            engine
        )
    assert all([call_[1][2] != FKEY_COL for call_ in mock_infer.mock_calls])
