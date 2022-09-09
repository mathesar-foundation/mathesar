from sqlalchemy import exists, func, literal, select
from sqlalchemy.dialects.postgresql import insert

from db import constants
from db.columns.base import MathesarColumn
from db.columns.operations.alter import batch_alter_table_drop_columns
from db.columns.operations.create import bulk_create_mathesar_column
from db.columns.operations.select import get_columns_name_from_attnums
from db.tables.operations.select import reflect_table_from_oid
from db.metadata import get_empty_metadata


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
        relationship = {"referencing": table_one, "referenced": table_two, "constraint": one_referencing_two[0]}
    elif two_referencing_one and not one_referencing_two:
        relationship = {"referencing": table_two, "referenced": table_one, "constraint": two_referencing_one[0]}
    else:
        relationship = None
    return relationship


def _check_columns(relationship, moving_columns):
    return (
        relationship is not None
        and all([not c.foreign_keys for c in moving_columns])
    )


def _get_table_connecting_columns(relationship, target_table):
    constraint = relationship['constraint']
    referrer_column = constraint.columns[0]
    referent_column = constraint.elements[0].column
    if relationship["referenced"] == target_table:
        source_table_reference_column = referrer_column
        target_table_reference_column = referent_column
    else:
        source_table_reference_column = referent_column
        target_table_reference_column = referrer_column
    return source_table_reference_column, target_table_reference_column


def move_columns_between_related_tables(
        source_table_oid,
        target_table_oid,
        column_attnums_to_move,
        schema,
        engine
):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    source_table = reflect_table_from_oid(source_table_oid, engine, metadata=metadata)
    target_table = reflect_table_from_oid(target_table_oid, engine, metadata=source_table.metadata)
    relationship = _find_table_relationship(source_table, target_table)
    column_names_to_move = get_columns_name_from_attnums(source_table_oid, column_attnums_to_move, engine, metadata=metadata)
    moving_columns = [source_table.columns[n] for n in column_names_to_move]
    assert _check_columns(relationship, moving_columns)
    source_table_reference_column, target_table_reference_column = _get_table_connecting_columns(
        relationship,
        target_table
    )
    extracted_columns = [MathesarColumn.from_column(col) for col in moving_columns]
    bulk_create_mathesar_column(engine, target_table_oid, extracted_columns, schema)
    # TODO reuse metadata
    target_table = reflect_table_from_oid(target_table_oid, engine, metadata=get_empty_metadata())
    if relationship["referenced"] == target_table:
        extracted_columns_update_stmt = _create_move_referrer_table_columns_update_stmt(
            source_table,
            target_table,
            moving_columns,
            source_table_reference_column,
        )
    else:
        extracted_columns_update_stmt = _create_move_referent_table_columns_update_stmt(
            source_table,
            target_table,
            moving_columns,
            source_table_reference_column,
            target_table_reference_column,
        )
    with engine.begin() as conn:
        conn.execute(extracted_columns_update_stmt)
        deletion_column_data = [{'attnum': column_attnum} for column_attnum in column_attnums_to_move]
        batch_alter_table_drop_columns(source_table_oid, deletion_column_data, conn, engine)
    # TODO reuse metadata
    source_table = reflect_table_from_oid(source_table_oid, engine, metadata=get_empty_metadata())
    return target_table, source_table


def _create_move_referent_table_columns_update_stmt(
        source_table,
        target_table,
        columns_to_move,
        source_table_reference_column,
        target_table_reference_column
):
    moved_column_names = [col.name for col in columns_to_move]
    extract_cte = select(
        source_table
    )
    extracted_columns_update_dict = {column_name: extract_cte.c[column_name] for column_name in moved_column_names}
    extract_ins = (
        target_table
        .update().values(**extracted_columns_update_dict)
        .where(target_table.c[target_table_reference_column.name] == extract_cte.c[source_table_reference_column.name])
    )

    return extract_ins


def _create_move_referrer_table_columns_update_stmt(
        source_table,
        target_table,
        columns_to_move,
        source_table_reference_column,
):
    SPLIT_ID = f"{constants.MATHESAR_PREFIX}_move_column_alias"
    moved_column_names = [col.name for col in columns_to_move]
    moved_columns = [
        source_table.c[moved_column_name]
        for moved_column_name in moved_column_names
    ]
    # New rank is computed using Existing ranking column + set of columns being moved
    ranking_columns = [source_table.c[source_table_reference_column.name]] + moved_columns
    target_table_existing_data_column_names = [
        column.name
        for column in target_table.columns
        if column.name != constants.ID and column.name not in moved_column_names
    ]
    ranked_target_table_columns = [
        target_table.c[column_name]
        for column_name in target_table_existing_data_column_names
    ]
    ranked_columns = [source_table.c[constants.ID]] + moved_columns + ranked_target_table_columns
    # Compute new rank to be used as the new foreign key value
    rank_cte = select(
        [
            *ranked_columns,
            func.dense_rank().over(order_by=ranking_columns).label(SPLIT_ID)
        ]
    ).join(target_table).cte()
    new_target_table_data_columns = target_table_existing_data_column_names + moved_column_names
    cte_extraction_columns = (
        [rank_cte.columns[SPLIT_ID]] + [rank_cte.columns[n] for n in new_target_table_data_columns]
    )
    extract_sel = select(
        cte_extraction_columns,
        distinct=True
    )
    extract_ins_stmt = (
        insert(target_table)
        .from_select([constants.ID] + new_target_table_data_columns, extract_sel)
        .returning(literal(1))
    )
    extract_ins_cte = extract_ins_stmt.on_conflict_do_update(
        index_elements=[target_table.c[constants.ID]],
        set_={
            name: extract_ins_stmt.excluded[name]
            for name in new_target_table_data_columns}
    ).cte()
    fk_update_dict = {source_table_reference_column.name: rank_cte.c[SPLIT_ID]}
    split_ins = (
        source_table
        .update().values(**fk_update_dict).
        where(
            source_table.c[constants.ID] == rank_cte.c[constants.ID],
            exists(extract_ins_cte.select())
        )
    )
    return split_ins
