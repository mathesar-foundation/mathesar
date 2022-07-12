from collections import defaultdict

from sqlalchemy import select, func, or_
from sqlalchemy_filters import apply_sort

from db.functions.operations.apply import apply_db_function_spec_as_filter
from db.columns.base import MathesarColumn
from db.records.operations import group
from db.tables.utils import get_primary_key_column
from db.types.operations.cast import get_column_cast_expression
from db.types.base import get_db_type_enum_from_id
from db.utils import execute_query


def _get_duplicate_only_cte(table, duplicate_columns):
    DUPLICATE_LABEL = "_is_dupe"
    duplicate_flag_cte = (
        select(
            *table.c,
            (func.count(1).over(partition_by=duplicate_columns) > 1).label(DUPLICATE_LABEL),
        ).select_from(table)
    ).cte()
    return select(duplicate_flag_cte).where(duplicate_flag_cte.c[DUPLICATE_LABEL]).cte()


def _sort_and_filter(query, order_by, filter):
    if order_by is not None:
        query = apply_sort(query, order_by)
    if filter is not None:
        query = apply_db_function_spec_as_filter(query, filter)
    return query


def preview_column_key(preview_column, column_name):
    return f"{preview_column}_fk_{column_name}"


def get_query(
    table,
    limit,
    offset,
    order_by,
    filter=None,
    columns_to_select=None,
    group_by=None,
    duplicate_only=None,
):
    if duplicate_only:
        select_target = _get_duplicate_only_cte(table, duplicate_only)
    else:
        select_target = table

    if isinstance(group_by, group.GroupBy):
        selectable = group.get_group_augmented_records_query(select_target, group_by)
    else:
        selectable = select(select_target)

    selectable = _sort_and_filter(selectable, order_by, filter)

    if columns_to_select:
        selectable = selectable.cte()
        selectable = select(*columns_to_select).select_from(selectable)

    selectable = selectable.limit(limit).offset(offset)
    return selectable


def get_record(table, engine, id_value):
    primary_key_column = get_primary_key_column(table)
    query = select(table).where(primary_key_column == id_value)
    result = execute_query(engine, query)
    assert len(result) <= 1
    return result[0] if result else None


def get_records_preview_data(
    records,
    engine,
    preview_columns
):
    if preview_columns:
        preview_filters = defaultdict(lambda: defaultdict(lambda: set()))
        for record in records:
            for referent_table_name, referent_obj in preview_columns.items():
                constraint_columns = referent_obj['constraint_columns']
                for constraint_column in constraint_columns:
                    constrained_column = constraint_column['constrained_column']
                    constrained_column_value = record[constrained_column]
                    if constrained_column_value is not None:
                        referent_column = constraint_column['referent_column']
                        preview_filters[referent_table_name][referent_column].add(constrained_column_value)
        preview_data = []
        for referent_table_name, referent_columns in preview_filters.items():
            referent_table = preview_columns[referent_table_name]['table']
            query = get_query(
                table=referent_table,
                columns_to_select=None,
                limit=None,
                offset=None,
                order_by=None
            )
            filters = []
            for referent_column, constrained_values in referent_columns.items():
                filters.append(referent_table.c[referent_column].in_(constrained_values))
            query = query.where(or_(*filters))
            preview_records = execute_query(engine, query)
            preview_obj = {
                'table': referent_table.name,
                'data': preview_records
            }
            preview_data.append(preview_obj)
        return preview_data


def get_records(
    table,
    engine,
    limit=None,
    offset=None,
    order_by=[],
    filter=None,
    group_by=None,
    duplicate_only=None
):
    """
    Returns annotated records from a table.

    Args:
        table:           SQLAlchemy table object
        engine:          SQLAlchemy engine object
        limit:           int, gives number of rows to return
        offset:          int, gives number of rows to skip
        order_by:        list of dictionaries, where each dictionary has a 'field' and
                         'direction' field.
                         See: https://github.com/centerofci/sqlalchemy-filters#sort-format
        filter:          a dictionary with one key-value pair, where the key is the filter id and
                         the value is a list of parameters; supports composition/nesting.
                         See: https://github.com/centerofci/sqlalchemy-filters#filters-format
        group_by:        group.GroupBy object
        duplicate_only:  list of column names; only rows that have duplicates across those rows
                         will be returned
        preview_columns: a dictionary with one key-value pair, where the key is the foreign key column attnum and
                         the value is a list of referent column attnums.
    """
    if not order_by:
        # Set default ordering if none was requested
        if len(table.primary_key.columns) > 0:
            # If there are primary keys, order by all primary keys
            order_by = [{'field': str(col.name), 'direction': 'asc'}
                        for col in table.primary_key.columns]
        else:
            # If there aren't primary keys, order by all columns
            order_by = [{'field': col, 'direction': 'asc'}
                        for col in table.columns]

    query = get_query(
        table=table,
        limit=limit,
        offset=offset,
        order_by=order_by,
        filter=filter,
        group_by=group_by,
        duplicate_only=duplicate_only,
    )
    return execute_query(engine, query)


def get_count(table, engine, filter=None):
    col_name = "_count"
    columns_to_select = [func.count().label(col_name)]
    query = get_query(
        table=table,
        limit=None,
        offset=None,
        order_by=None,
        filter=filter,
        columns_to_select=columns_to_select
    )
    return execute_query(engine, query)[0][col_name]


def get_column_cast_records(engine, table, column_definitions, num_records=20):
    assert len(column_definitions) == len(table.columns)
    cast_expression_list = [
        _get_column_cast_expression_or_column(column, col_def, engine)
        for column, col_def in zip(table.columns, column_definitions)
    ]
    sel = select(cast_expression_list).limit(num_records)
    with engine.begin() as conn:
        result = conn.execute(sel)
    return result.fetchall()


def _get_column_cast_expression_or_column(column, col_def, engine):
    """
    Will return a cast expression for column, unless it's a default column, in which case the
    unchaged column will be returned.
    """
    target_type = get_db_type_enum_from_id(col_def["type"])
    if target_type is None:
        raise Exception(
            "Unknown db type id encountered. This should be handled in the request "
            + "validation phase. Something is wrong."
        )
    type_options = col_def.get("type_options", {})
    if not MathesarColumn.from_column(column).is_default:
        return (
            get_column_cast_expression(
                column=column,
                target_type=target_type,
                engine=engine,
                type_options=type_options,
            )
            .label(col_def["name"])
        )
    else:
        return column
