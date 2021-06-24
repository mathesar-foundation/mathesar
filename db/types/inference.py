import logging
from sqlalchemy import MetaData, Table
from sqlalchemy import VARCHAR, TEXT, Text
from sqlalchemy.exc import DatabaseError
from db.types import alteration
from db import tables

logger = logging.getLogger(__name__)

MAX_INFERENCE_DAG_DEPTH = 100

TYPE_INFERENCE_DAG = {
    alteration.BOOLEAN: [],
    alteration.EMAIL: [],
    alteration.INTERVAL: [],
    alteration.NUMERIC: [
        alteration.BOOLEAN,
    ],
    alteration.STRING: [
        alteration.BOOLEAN,
        alteration.NUMERIC,
        alteration.INTERVAL,
        alteration.EMAIL,
    ],
}


class DagCycleError(Exception):
    pass


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
    supported_types = alteration.get_supported_alter_column_types(engine)
    reverse_type_map = {
        Text: alteration.STRING,
        TEXT: alteration.STRING,
        VARCHAR: alteration.STRING,
    }
    reverse_type_map.update({v: k for k, v in supported_types.items()})

    table = tables.reflect_table(table_name, schema, engine)
    column_type = table.columns[column_name].type.__class__
    column_type_str = reverse_type_map.get(column_type)

    logger.debug(f"column_type_str: {column_type_str}")
    for type_str in type_inference_dag.get(column_type_str, []):
        try:
            alteration.alter_column_type(
                schema, table_name, column_name, type_str, engine
            )
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
