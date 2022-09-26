import pytest
from sqlalchemy import MetaData, select

from db.columns.operations.select import get_columns_attnum_from_names
from db.tables.operations.move_columns import move_columns_between_related_tables
from db.tables.operations.select import get_oid_from_table
from db.metadata import get_empty_metadata


def test_move_columns_moves_column_from_ext_to_rem(extracted_remainder_roster, roster_extracted_cols):
    extracted, remainder, engine, schema = extracted_remainder_roster
    moving_col = roster_extracted_cols[0]
    extracted_cols = [col.name for col in extracted.columns]
    remainder_cols = [col.name for col in remainder.columns]
    expect_extracted_cols = [
        name for name in extracted_cols if name != moving_col
    ]
    expect_remainder_cols = remainder_cols + [moving_col]
    extracted_name = extracted.name
    remainder_name = remainder.name
    extracted_oid = get_oid_from_table(extracted_name, schema, engine)
    remainder_oid = get_oid_from_table(remainder_name, schema, engine)
    column_attnums_to_move = get_columns_attnum_from_names(extracted_oid, [moving_col], engine, metadata=get_empty_metadata())
    move_columns_between_related_tables(
        extracted_oid,
        remainder_oid,
        column_attnums_to_move,
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
    extracted, remainder, engine, schema = extracted_remainder_roster
    extracted_cols = [col.name for col in extracted.columns]
    remainder_cols = [col.name for col in remainder.columns]
    moving_col = "Grade"
    expect_remainder_cols = [
        name for name in remainder_cols if name != moving_col
    ]
    expect_extracted_cols = extracted_cols + [moving_col]
    extracted_name = extracted.name
    remainder_name = remainder.name
    extracted_oid = get_oid_from_table(extracted_name, schema, engine)
    remainder_oid = get_oid_from_table(remainder_name, schema, engine)
    column_attnums_to_move = get_columns_attnum_from_names(remainder_oid, [moving_col], engine, metadata=get_empty_metadata())
    move_columns_between_related_tables(
        remainder_oid,
        extracted_oid,
        column_attnums_to_move,
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


def test_move_columns_moves_correct_data_from_ext_to_rem(extracted_remainder_roster, roster_extracted_cols):
    extracted, remainder, engine, schema = extracted_remainder_roster
    moving_col = roster_extracted_cols[0]
    extracted_name = extracted.name
    remainder_name = remainder.name
    expect_tuple_sel = (
        select(extracted.columns[moving_col])
        .distinct()
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()
    extracted_oid = get_oid_from_table(extracted_name, schema, engine)
    remainder_oid = get_oid_from_table(remainder_name, schema, engine)
    column_attnums_to_move = get_columns_attnum_from_names(extracted_oid, [moving_col], engine, metadata=get_empty_metadata())
    move_columns_between_related_tables(
        extracted_oid,
        remainder_oid,
        column_attnums_to_move,
        schema,
        engine,
    )
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    new_remainder = metadata.tables[f"{schema}.{remainder_name}"]
    actual_tuple_sel = select(
        [new_remainder.columns[moving_col]],
        distinct=True
    )
    with engine.begin() as conn:
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()
    assert sorted(expect_tuples) == sorted(actual_tuples)


@pytest.mark.skip(reason="solution unclear; might be unrelated to PR at hand")
def test_move_columns_moves_correct_data_from_rem_to_extract(extracted_remainder_roster, roster_extracted_cols):
    extracted, remainder, engine, schema = extracted_remainder_roster
    moving_col = "Grade"
    existing_extracted_table_column_names = ['Teacher', 'Teacher Email']

    # build expected tuple table
    existing_extracted_table_columns = [
        extracted.columns[existing_extracted_table_column_name]
        for existing_extracted_table_column_name in existing_extracted_table_column_names
    ]
    expect_tuple_sel = (
        select([*existing_extracted_table_columns, remainder.columns[moving_col]]).join(extracted)
        # NOTE below distinct's purpose is unclear
        .distinct()
    )
    with engine.begin() as conn:
        expect_tuples = conn.execute(expect_tuple_sel).fetchall()

    # move columns from "remainder" to "extracted" table
    extracted_name = extracted.name
    remainder_name = remainder.name
    extracted_oid = get_oid_from_table(extracted_name, schema, engine)
    remainder_oid = get_oid_from_table(remainder_name, schema, engine)
    column_attnums_to_move = get_columns_attnum_from_names(remainder_oid, [moving_col], engine, metadata=get_empty_metadata())
    move_columns_between_related_tables(
        remainder_oid,
        extracted_oid,
        column_attnums_to_move,
        schema,
        engine,
    )

    # reflect records in "extracted" table after move
    metadata = MetaData(bind=engine, schema=schema)
    metadata.reflect()
    new_extracted = metadata.tables[f"{schema}.{extracted_name}"]
    new_existing_extracted_table_columns = [
        new_extracted.columns[existing_extracted_table_column_name]
        for existing_extracted_table_column_name in existing_extracted_table_column_names
    ]
    actual_tuple_sel = select(
        [
            *new_existing_extracted_table_columns,
            new_extracted.columns[moving_col]

        ],
    )
    with engine.begin() as conn:
        actual_tuples = conn.execute(actual_tuple_sel).fetchall()

    # check that expected and actual tuple tables match
    assert sorted(expect_tuples) == sorted(actual_tuples)
