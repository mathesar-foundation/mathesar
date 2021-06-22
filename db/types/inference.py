import logging
from contextlib import ExitStack
from sqlalchemy import MetaData, Table
from sqlalchemy import VARCHAR, TEXT, Text
from sqlalchemy.exc import DatabaseError
from db.types import alteration

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
        conn=None,
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

    with ExitStack() as stack:
        if conn is not None:
            stack.enter_context(conn.begin())
        else:
            conn = stack.enter_context(engine.begin())
        metadata = MetaData(bind=engine, schema=schema)
        column_type = Table(
            table_name, metadata, schema=schema, autoload_with=conn if conn else engine,
        ).columns[column_name].type.__class__
        column_type_str = reverse_type_map.get(column_type)

    logger.debug(f"column_type_str: {column_type_str}")
    for type_str in type_inference_dag.get(column_type_str, []):
        try:
            alteration.alter_column_type(
                schema, table_name, column_name, type_str, engine, conn=conn
            )
            logger.info(f"Column {column_name} altered to type {type_str}")
            column_type = infer_column_type(
                schema,
                table_name,
                column_name,
                engine,
                depth=depth + 1,
                type_inference_dag=type_inference_dag,
                conn=conn,
            )
            break
        # It's expected we catch this error when the test to see whether
        # a type is appropriate for a column fails.
        except DatabaseError:
            logger.info(
                f"Cannot alter column {column_name} to type {type_str}"
            )
    return column_type
