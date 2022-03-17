import logging

from sqlalchemy import VARCHAR, TEXT, Text
from sqlalchemy.exc import DatabaseError

from db.columns.exceptions import DagCycleError
from db.columns.operations.alter import alter_column_type
from db.tables.operations.select import get_oid_from_table, reflect_table
from db.types.operations.cast import get_supported_alter_column_types
from db.types import base


logger = logging.getLogger(__name__)

MAX_INFERENCE_DAG_DEPTH = 100

TYPE_INFERENCE_DAG = {
    base.PostgresType.TEXT.value:[],
    base.PostgresType.BOOLEAN.value: [],
    base.MathesarCustomType.EMAIL.value: [],
    base.PostgresType.INTERVAL.value: [],
    base.PostgresType.NUMERIC.value: [
        base.PostgresType.BOOLEAN.value,
    ],
    base.STRING: [
        base.PostgresType.BOOLEAN.value,
        base.PostgresType.DATE.value,
        base.PostgresType.NUMERIC.value,
        base.MathesarCustomType.MATHESAR_MONEY.value,
        base.PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.value,
        base.PostgresType.TIMESTAMP_WITH_TIME_ZONE.value,
        # We only infer to TIME_WITHOUT_TIME_ZONE as time zones don't make much sense
        # without additional date information. See postgres documentation for further
        # details: https://www.postgresql.org/docs/13/datatype-datetime.html
        base.PostgresType.TIME_WITHOUT_TIME_ZONE.value,
        base.PostgresType.INTERVAL.value,
        base.MathesarCustomType.EMAIL.value,
        base.MathesarCustomType.URI.value,
    ],
}


def _get_reverse_type_map(engine):
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


def infer_column_type(schema, table_name, column_name, engine, depth=0, type_inference_dag=TYPE_INFERENCE_DAG):
    if depth > MAX_INFERENCE_DAG_DEPTH:
        raise DagCycleError("The type_inference_dag likely has a cycle")
    reverse_type_map = _get_reverse_type_map(engine)

    table = reflect_table(table_name, schema, engine)
    column_type = table.columns[column_name].type.__class__
    column_type_str = reverse_type_map.get(column_type)

    logger.debug(f"column_type_str: {column_type_str}")
    table_oid = get_oid_from_table(table_name, schema, engine)
    for type_str in type_inference_dag.get(column_type_str, []):
        try:
            with engine.begin() as conn:
                alter_column_type(table_oid, column_name, engine, conn, type_str)
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
