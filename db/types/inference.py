import logging
from time import time

from sqlalchemy import VARCHAR, TEXT, Text, select
from sqlalchemy.exc import DatabaseError

from db import constants, columns, schemas
from db.tables.ddl.create import CreateTableAs
from db.tables.utils import reflect_table
from db.types.alteration import get_supported_alter_column_types, alter_column_type
from db.types import base


logger = logging.getLogger(__name__)

MAX_INFERENCE_DAG_DEPTH = 100

TYPE_INFERENCE_DAG = {
    base.PostgresType.BOOLEAN.value: [],
    base.MathesarCustomType.EMAIL.value: [],
    base.PostgresType.INTERVAL.value: [],
    base.PostgresType.NUMERIC.value: [
        base.PostgresType.BOOLEAN.value,
    ],
    base.STRING: [
        base.PostgresType.BOOLEAN.value,
        base.PostgresType.NUMERIC.value,
        base.PostgresType.DATE.value,
        base.PostgresType.INTERVAL.value,
        base.MathesarCustomType.EMAIL.value,
    ],
}

TEMP_SCHEMA = f"{constants.MATHESAR_PREFIX}temp_schema"
TEMP_TABLE = f"{constants.MATHESAR_PREFIX}temp_table_%s"


class DagCycleError(Exception):
    pass


def get_reverse_type_map(engine):
    supported_types = get_supported_alter_column_types(engine)
    reverse_type_map = {v: k for k, v in supported_types.items()}
    reverse_type_map.update(
        {
            Text: base.STRING,
            TEXT: base.STRING,
            VARCHAR: base.STRING,
        }
    )
    return reverse_type_map


def infer_column_type(
        schema,
        table_name,
        column_name,
        engine,
        depth=0,
        type_inference_dag=TYPE_INFERENCE_DAG,
):
    if depth > MAX_INFERENCE_DAG_DEPTH:
        raise DagCycleError("The type_inference_dag likely has a cycle")
    reverse_type_map = get_reverse_type_map(engine)

    table = reflect_table(table_name, schema, engine)
    column_type = table.columns[column_name].type.__class__
    column_type_str = reverse_type_map.get(column_type)

    logger.debug(f"column_type_str: {column_type_str}")
    for type_str in type_inference_dag.get(column_type_str, []):
        try:
            with engine.begin() as conn:
                alter_column_type(table, column_name, engine, conn, type_str)
            logger.info(f"Column {column_name} altered to type {type_str}")
            column_type = infer_column_type(
                schema,
                table_name,
                column_name,
                engine,
                depth=depth + 1,
                type_inference_dag=type_inference_dag,
            )
            break
        # It's expected we catch this error when the test to see whether
        # a type is appropriate for a column fails.
        except DatabaseError:
            logger.info(
                f"Cannot alter column {column_name} to type {type_str}"
            )
    return column_type


def update_table_column_types(schema, table_name, engine):
    table = reflect_table(table_name, schema, engine)
    # we only want to infer (modify) the type of non-default columns
    inferable_column_names = (
        col.name for col in table.columns
        if not columns.MathesarColumn.from_column(col).is_default
        and not col.primary_key
        and not col.foreign_keys
    )
    for column_name in inferable_column_names:
        infer_column_type(
            schema,
            table_name,
            column_name,
            engine,
        )


def infer_table_column_types(schema, table_name, engine):
    table = reflect_table(table_name, schema, engine)

    temp_name = TEMP_TABLE % (int(time()))
    schemas.create_schema(TEMP_SCHEMA, engine)
    with engine.begin() as conn:
        while engine.dialect.has_table(conn, temp_name, schema=TEMP_SCHEMA):
            temp_name = TEMP_TABLE.format(int(time()))

    full_temp_name = f"{TEMP_SCHEMA}.{temp_name}"

    select_table = select(table)
    with engine.begin() as conn:
        conn.execute(CreateTableAs(full_temp_name, select_table))
    temp_table = reflect_table(temp_name, TEMP_SCHEMA, engine)

    try:
        update_table_column_types(
            TEMP_SCHEMA, temp_table.name, engine,
        )
    except Exception as e:
        # Ensure the temp table is deleted
        temp_table.drop()
        raise e
    else:
        temp_table = reflect_table(temp_name, TEMP_SCHEMA, engine)
        types = [c.type.__class__ for c in temp_table.columns]
        temp_table.drop()
        return types
