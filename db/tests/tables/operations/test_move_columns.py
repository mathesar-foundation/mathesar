from sqlalchemy import MetaData

from db.tables.operations.move_columns import move_columns_between_related_tables
from db.tables.operations.select import get_oid_from_table


def test_move_columns_moves_column_from_ext_to_rem(extracted_remainder_roster, roster_extracted_cols):
    extracted, remainder, _, engine, schema = extracted_remainder_roster
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
    move_columns_between_related_tables(
        extracted_oid,
        remainder_oid,
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
    extracted_oid = get_oid_from_table(extracted_name, schema, engine)
    remainder_oid = get_oid_from_table(remainder_name, schema, engine)
    move_columns_between_related_tables(
        remainder_oid,
        extracted_oid,
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
