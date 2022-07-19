from db.columns.base import MathesarColumn
from db import constants
from db.tables.operations.split import extract_columns_from_table
from db.tables.operations.merge import merge_tables
from db.tables.operations.select import reflect_table, reflect_table_from_oid


def _find_table_relationship(table_one, table_two):
    """
    This function takes two tables, and returns a dict defining the direction
    of the foreign key constraint relating the tables (if one exists)
    """
    one_referencing_two = [
        fkey_constraint for fkey_constraint in table_one.foreign_key_constraints
        if fkey_constraint.referred_table == table_two
    ]
    two_referencing_one = [
        fkey_constraint for fkey_constraint in table_two.foreign_key_constraints
        if fkey_constraint.referred_table == table_one
    ]
    if one_referencing_two and not two_referencing_one:
        relationship = {"referencing": table_one, "referenced": table_two}
    elif two_referencing_one and not one_referencing_two:
        relationship = {"referencing": table_two, "referenced": table_one}
    else:
        relationship = None
    return relationship


def _check_columns(relationship, source_table, moving_columns):
    return (
        relationship is not None
        and all([not c.foreign_keys for c in moving_columns])
    )


def _get_column_moving_extraction_args(relationship, target_table, target_table_name, source_table, source_table_name, moving_columns, column_names):
    if relationship["referenced"] == target_table:
        extracted_table_name = target_table_name
        remainder_table_name = source_table_name
        extraction_columns = [
            col for col in target_table.columns
            if not MathesarColumn.from_column(col).is_default
        ] + moving_columns
    else:
        extracted_table_name = source_table_name
        remainder_table_name = target_table_name
        extraction_columns = [
            col for col in source_table.columns
            if not MathesarColumn.from_column(col).is_default
            and col.name not in column_names
        ]
    return extracted_table_name, remainder_table_name, extraction_columns


def move_columns_between_related_tables(source_table_oid, target_table_oid, column_names, schema, engine):
    TEMP_MERGED_TABLE_NAME = f"{constants.MATHESAR_PREFIX}_temp_merge_table"
    source_table_name = reflect_table_from_oid(source_table_oid, engine).name
    target_table_name = reflect_table_from_oid(target_table_oid, engine).name
    source_table = reflect_table(source_table_name, schema, engine)
    target_table = reflect_table(
        target_table_name, schema, engine, metadata=source_table.metadata
    )
    relationship = _find_table_relationship(source_table, target_table)
    moving_columns = [source_table.columns[n] for n in column_names]
    assert _check_columns(relationship, source_table, moving_columns)
    ext_args = _get_column_moving_extraction_args(
        relationship,
        target_table,
        target_table_name,
        source_table,
        source_table_name,
        moving_columns,
        column_names,
    )
    (extracted_table_name, remainder_table_name, extraction_columns) = ext_args
    merge_tables(
        source_table_name,
        target_table_name,
        TEMP_MERGED_TABLE_NAME,
        schema,
        engine,
        drop_original_tables=True,
    )
    extracted_table, remainder_table, _ = extract_columns_from_table(
        TEMP_MERGED_TABLE_NAME,
        [c.name for c in extraction_columns],
        extracted_table_name,
        schema,
        engine,
    )
    return extracted_table, remainder_table
