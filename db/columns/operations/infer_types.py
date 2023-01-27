import logging

from sqlalchemy import VARCHAR, TEXT, Text
from sqlalchemy.exc import DatabaseError

from db.columns.exceptions import DagCycleError
from db.columns.operations.alter import alter_column_type
from db.tables.operations.select import get_oid_from_table, reflect_table
from db.types.base import PostgresType, MathesarCustomType, get_available_known_db_types
from db.metadata import get_empty_metadata


logger = logging.getLogger(__name__)

MAX_INFERENCE_DAG_DEPTH = 100

TYPE_INFERENCE_DAG = {
    PostgresType.BOOLEAN: [],
    MathesarCustomType.EMAIL: [],
    PostgresType.INTERVAL: [],
    PostgresType.NUMERIC: [
        PostgresType.BOOLEAN,
    ],
    PostgresType.TEXT: [
        PostgresType.BOOLEAN,
        PostgresType.DATE,
        PostgresType.NUMERIC,
        MathesarCustomType.MATHESAR_MONEY,
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        # We only infer to TIME_WITHOUT_TIME_ZONE as time zones don't make much sense
        # without additional date information. See postgres documentation for further
        # details: https://www.postgresql.org/docs/13/datatype-datetime.html
        PostgresType.TIME_WITHOUT_TIME_ZONE,
        PostgresType.INTERVAL,
        MathesarCustomType.EMAIL,
        MathesarCustomType.URI,
        MathesarCustomType.MATHESAR_JSON_ARRAY,
        MathesarCustomType.MATHESAR_JSON_OBJECT,
    ],
}


def infer_column_type(schema, table_name, column_name, engine, depth=0, type_inference_dag=None, metadata=None, columns_might_have_defaults=True):
    """
    Attempts to cast the column to the best type for it, given the mappings defined in TYPE_INFERENCE_DAG
    and _get_type_classes_mapped_to_dag_nodes. Returns the resulting column type's class.

    Algorithm:
        1. reflect the column's type class;
        2. use _get_type_classes_mapped_to_dag_nodes to map it to a TYPE_INFERENCE_DAG key;
        3. look up the sequence of types referred to by that key on the TYPE_INFERENCE_DAG;
            - if there's no such key on the TYPE_INFERENCE_DAG dict, or if its value is an empty
            list, return the current column type's class;
        4. iterate through that sequence of types trying to alter the column's type to them;
            - if the column's type is altered successfully, break iteration and return the output
            of running infer_column_type again (trigger tail recursion);
            - if none of the column type alterations succeed, return the current column type's
            class.
    """
    if type_inference_dag is None:
        type_inference_dag = TYPE_INFERENCE_DAG
    metadata = metadata if metadata else get_empty_metadata()
    if depth > MAX_INFERENCE_DAG_DEPTH:
        raise DagCycleError("The type_inference_dag likely has a cycle")
    type_classes_to_dag_nodes = _get_type_classes_mapped_to_dag_nodes(engine)
    column_type_class = _get_column_class(
        engine=engine,
        schema=schema,
        table_name=table_name,
        column_name=column_name,
        metadata=metadata,
    )
    # a DAG node will be a DatabaseType Enum
    dag_node = type_classes_to_dag_nodes.get(column_type_class)
    logger.debug(f"dag_node: {dag_node}")
    types_to_cast_to = type_inference_dag.get(dag_node, [])
    table_oid = get_oid_from_table(table_name, schema, engine)
    for db_type in types_to_cast_to:
        try:
            with engine.begin() as conn:
                alter_column_type(
                    table_oid,
                    column_name,
                    engine,
                    conn,
                    db_type,
                    metadata=metadata,
                    columns_might_have_defaults=columns_might_have_defaults,
                )
            logger.info(f"Column {column_name} altered to type {db_type.id}")
            column_type_class = infer_column_type(
                schema,
                table_name,
                column_name,
                engine,
                depth=depth + 1,
                type_inference_dag=type_inference_dag,
                metadata=metadata
            )
            break
        # It's expected we catch this error when the test to see whether
        # a type is appropriate for a column fails.
        except DatabaseError:
            logger.info(
                f"Cannot alter column {column_name} to type {db_type.id}"
            )
    return column_type_class


def _get_column_class(engine, schema, table_name, column_name, metadata):
    # Metadata can be reused because reflect_table fetches the table details again
    table = reflect_table(table_name, schema, engine, metadata=metadata)
    column_type_class = table.columns[column_name].type.__class__
    return column_type_class


def _get_type_classes_mapped_to_dag_nodes(engine):
    """
    Returns SA type classes mapped to TYPE_INFERENCE_DAG nodes.

    Purpose of this mapping is to find the wanted position on the TYPE_INFERENCE_DAG, given a
    column's SA type class.
    """
    type_classes_to_enums = {
        db_type.get_sa_class(engine): db_type
        for db_type
        in get_available_known_db_types(engine)
    }
    # NOTE: below dict merge sets some keys to PostgresType.TEXT, which, in infer_column_type,
    # maps these classes to the types grouped under TYPE_INFERENCE_DAG[PostgresType.TEXT].
    type_classes_to_dag_nodes = (
        type_classes_to_enums | {
            Text: PostgresType.TEXT,
            TEXT: PostgresType.TEXT,
            VARCHAR: PostgresType.TEXT,
        }
    )
    return type_classes_to_dag_nodes
