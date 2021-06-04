from sqlalchemy import (
    Column, String, Table, MetaData, func, select, ForeignKey, literal, exists,
    join
)

from db import columns, constants, schemas
from db.types import inference


def create_string_column_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns_ = [Column(column_name, String) for column_name in column_names]
    table = create_mathesar_table(name, schema, columns_, engine)
    return table


def create_mathesar_table(name, schema, columns_, engine, metadata=None):
    """
    This method creates a Postgres table in the specified schema using the
    given name and column list.  It adds internal mathesar columns to the
    table.
    """
    columns_ = columns.init_mathesar_table_column_list_with_defaults(columns_)
    schemas.create_schema(schema, engine)
    # We need this so that we can create multiple mathesar tables in the
    # same MetaData, enabling them to reference each other in the
    # SQLAlchemy context (e.g., for creating a ForeignKey relationship)
    if metadata is None:
        metadata = MetaData(bind=engine, schema=schema)
    # This reflection step lets us notice any "table already exists"
    # errors before sending error-generating requests to the DB.
    metadata.reflect()
    table = Table(
        name,
        metadata,
        *columns_,
        schema=schema
    )
    table.create(engine)
    return table


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


def reflect_table_from_oid(oid, engine):
    metadata = MetaData()
    pg_class = Table("pg_class", metadata, autoload_with=engine)
    pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = (
        select(pg_namespace.c.nspname, pg_class.c.relname)
        .select_from(
            join(
                pg_class,
                pg_namespace,
                pg_class.c.relnamespace == pg_namespace.c.oid
            )
        )
        .where(pg_class.c.oid == oid)
    )
    with engine.begin() as conn:
        schema, table_name = conn.execute(sel).fetchall()[0]
    return reflect_table(table_name, schema, engine)


def reflect_table(name, schema, engine, metadata=None):
    if metadata is None:
        metadata = MetaData(bind=engine)
    return Table(name, metadata, schema=schema, autoload_with=engine)


def get_count(table, engine):
    query = select([func.count()]).select_from(table)
    with engine.begin() as conn:
        return conn.execute(query).scalar()


def infer_table_column_types(
        schema,
        table_name,
        engine,
):
    table = reflect_table(table_name, schema, engine)
    # we only want to infer (modify) the type of non-default columns
    inferable_column_names = (
        col.name for col in table.columns
        if not columns.MathesarColumn.from_column(col).is_default
        and not col.primary_key
        and not col.foreign_keys
    )
    for column_name in inferable_column_names:
        inference.infer_column_type(
            schema,
            table_name,
            column_name,
            engine,
        )
