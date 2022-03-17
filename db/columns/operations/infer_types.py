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


def _get_type_classes_mapped_to_type_ids(engine):
    """
    Returns SA type classes mapped to their type names/ids (as compiled by SA's PG dialect).
    """
    # NOTE: it's interesting that we're using friendly_names=True here,
    # I expected the "unfriendly" names to be used internally.
    type_ids_to_classes = get_supported_alter_column_types(engine, friendly_names=True)
    type_classes_to_ids = {v: k for k, v in type_ids_to_classes.items()}
    # NOTE: below dict merge seems to add some meta-entries to this map, which later, in
    # infer_column_type, are used to leverage recursion.
    type_classes_to_ids.update(
        {
            Text: base.STRING,
            TEXT: base.STRING,
            VARCHAR: base.STRING,
        }
    )
    return type_classes_to_ids


def infer_column_type(schema, table_name, column_name, engine, depth=0, type_inference_dag=TYPE_INFERENCE_DAG):
    if depth > MAX_INFERENCE_DAG_DEPTH:
        raise DagCycleError("The type_inference_dag likely has a cycle")

    type_classes_to_ids = _get_type_classes_mapped_to_type_ids(engine)

    column_type_class = get_column_class(
        engine=engine,
        schema=schema,
        table_name=table_name,
        column_name=column_name
    )

    column_type_id = type_classes_to_ids.get(column_type_class)

    logger.debug(f"column_type_id: {column_type_id}")

    type_ids_to_cast_to = type_inference_dag.get(column_type_id, [])

    table_oid = get_oid_from_table(table_name, schema, engine)

    for type_id in type_ids_to_cast_to:
        try:
            with engine.begin() as conn:
                alter_column_type(table_oid, column_name, engine, conn, type_id)
            logger.info(f"Column {column_name} altered to type {type_id}")
            column_type_class = infer_column_type(
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
                f"Cannot alter column {column_name} to type {type_id}"
            )
    return column_type_class


def get_column_class(engine, schema, table_name, column_name):
    table = reflect_table(table_name, schema, engine)
    column_type_class = table.columns[column_name].type.__class__
    return column_type_class
