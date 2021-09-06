"""
This file contains functions that involve altering tables at the database level.
"""

from sqlalchemy import Column, func, select, ForeignKey, literal, exists
from sqlalchemy.schema import DDLElement
from sqlalchemy.ext import compiler
from alembic.migration import MigrationContext
from alembic.operations import Operations

from db import columns, constants
from db.tables.ddl.create import create_mathesar_table
from db.tables.utils import reflect_table


SUPPORTED_TABLE_UPDATE_ARGS = {'name', 'sa_columns'}


def rename_table(name, schema, engine, rename_to):
    table = reflect_table(name, schema, engine)
    if rename_to == table.name:
        return
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.rename_table(table.name, rename_to, schema=table.schema)


def update_table(table_name, table_oid, schema, engine, update_data):
    if 'name' in update_data and 'sa_columns' in update_data:
        raise ValueError('Only name or columns can be passed in, not both.')
    if 'name' in update_data:
        rename_table(table_name, schema, engine, update_data['name'])
    if 'sa_columns' in update_data:
        columns.batch_update_columns(table_oid, engine, update_data['sa_columns'])


def _split_column_list(columns_, extracted_column_names):
    extracted_columns = [
        col for col in columns_ if col.name in extracted_column_names
    ]
    remainder_columns = [
        col for col in columns_ if col.name not in extracted_column_names
    ]
    return extracted_columns, remainder_columns


def _create_split_tables(
        extracted_table_name,
        extracted_columns,
        remainder_table_name,
        remainder_columns,
        schema,
        engine,
):
    extracted_table = create_mathesar_table(
        extracted_table_name,
        schema,
        extracted_columns,
        engine,
    )
    remainder_fk_column = Column(
        f"{extracted_table.name}_{constants.ID}",
        columns.ID_TYPE,
        ForeignKey(f"{extracted_table.name}.{constants.ID}"),
        nullable=False,
    )
    remainder_table = create_mathesar_table(
        remainder_table_name,
        schema,
        [remainder_fk_column] + remainder_columns,
        engine,
        metadata=extracted_table.metadata
    )
    return extracted_table, remainder_table, remainder_fk_column.name


def _create_split_insert_stmt(
        old_table,
        extracted_table,
        extracted_columns,
        remainder_table,
        remainder_columns,
        remainder_fk_name,
):
    SPLIT_ID = f"{constants.MATHESAR_PREFIX}_split_column_alias"
    extracted_column_names = [col.name for col in extracted_columns]
    remainder_column_names = [col.name for col in remainder_columns]
    split_cte = select(
        [
            old_table,
            func.dense_rank().over(order_by=extracted_columns).label(SPLIT_ID)
        ]
    ).cte()
    cte_extraction_columns = (
        [split_cte.columns[SPLIT_ID]]
        + [split_cte.columns[n] for n in extracted_column_names]
    )
    cte_remainder_columns = (
        [split_cte.columns[SPLIT_ID]]
        + [split_cte.columns[n] for n in remainder_column_names]
    )
    extract_sel = select(
        cte_extraction_columns,
        distinct=True
    )
    extract_ins_cte = (
        extracted_table
        .insert()
        .from_select([constants.ID] + extracted_column_names, extract_sel)
        .returning(literal(1))
        .cte()
    )
    remainder_sel = select(
        cte_remainder_columns,
        distinct=True
    ).where(exists(extract_ins_cte.select()))

    split_ins = (
        remainder_table
        .insert()
        .from_select(
            [remainder_fk_name] + remainder_column_names,
            remainder_sel
        )
    )
    return split_ins


def extract_columns_from_table(
        old_table_name,
        extracted_column_names,
        extracted_table_name,
        remainder_table_name,
        schema,
        engine,
        drop_original_table=False,
):
    old_table = reflect_table(old_table_name, schema, engine)
    old_columns = (
        columns.MathesarColumn.from_column(col) for col in old_table.columns
    )
    old_non_default_columns = [
        col for col in old_columns if not col.is_default
    ]
    extracted_columns, remainder_columns = _split_column_list(
        old_non_default_columns, extracted_column_names,
    )
    with engine.begin() as conn:
        extracted_table, remainder_table, remainder_fk = _create_split_tables(
            extracted_table_name,
            extracted_columns,
            remainder_table_name,
            remainder_columns,
            schema,
            engine,
        )
        split_ins = _create_split_insert_stmt(
            old_table,
            extracted_table,
            extracted_columns,
            remainder_table,
            remainder_columns,
            remainder_fk,
        )
        conn.execute(split_ins)
    if drop_original_table:
        old_table.drop()

    return extracted_table, remainder_table, remainder_fk


def merge_tables(
        table_name_one,
        table_name_two,
        merged_table_name,
        schema,
        engine,
        drop_original_tables=False,
):
    """
    This specifically undoes the `extract_columns_from_table` (up to
    unique rows).  It may not work in other contexts (yet).
    """
    table_one = reflect_table(table_name_one, schema, engine)
    table_two = reflect_table(
        table_name_two, schema, engine, metadata=table_one.metadata
    )
    merge_join = table_one.join(table_two)
    referencing_columns = [
        col for col in [merge_join.onclause.left, merge_join.onclause.right]
        if col.foreign_keys
    ]
    merged_columns_all = [
        columns.MathesarColumn.from_column(col)
        for col in list(table_one.columns) + list(table_two.columns)
        if col not in referencing_columns
    ]
    merged_columns = [col for col in merged_columns_all if not col.is_default]
    with engine.begin() as conn:
        merged_table = create_mathesar_table(
            merged_table_name, schema, merged_columns, engine,
        )
        insert_stmt = merged_table.insert().from_select(
            [col.name for col in merged_columns],
            select(merged_columns, distinct=True).select_from(merge_join)
        )
        conn.execute(insert_stmt)

    if drop_original_tables:
        if table_one.foreign_keys:
            table_one.drop(bind=engine)
            table_two.drop(bind=engine)
        else:
            table_two.drop(bind=engine)
            table_one.drop(bind=engine)

    return merged_table


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


def _get_column_moving_extraction_args(
        relationship,
        target_table,
        target_table_name,
        source_table,
        source_table_name,
        moving_columns,
        column_names,
):
    if relationship["referenced"] == target_table:
        extracted_table_name = target_table_name
        remainder_table_name = source_table_name
        extraction_columns = [
            col for col in target_table.columns
            if not columns.MathesarColumn.from_column(col).is_default
        ] + moving_columns
    else:
        extracted_table_name = source_table_name
        remainder_table_name = target_table_name
        extraction_columns = [
            col for col in source_table.columns
            if not columns.MathesarColumn.from_column(col).is_default
            and col.name not in column_names
        ]
    return extracted_table_name, remainder_table_name, extraction_columns


def move_columns_between_related_tables(
        source_table_name,
        target_table_name,
        column_names,
        schema,
        engine,
):
    TEMP_MERGED_TABLE_NAME = f"{constants.MATHESAR_PREFIX}_temp_merge_table"
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
        remainder_table_name,
        schema,
        engine,
        drop_original_table=True,
    )
    return extracted_table, remainder_table


class CreateTableAs(DDLElement):
    def __init__(self, name, selectable):
        self.name = name
        self.selectable = selectable


@compiler.compiles(CreateTableAs)
def compile_create_table_as(element, compiler, **_):
    return "CREATE TABLE %s AS (%s)" % (
        element.name,
        compiler.sql_compiler.process(element.selectable, literal_binds=True),
    )
