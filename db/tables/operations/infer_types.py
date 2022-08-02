from time import time

from sqlalchemy import select

from db import constants
from db.columns.base import MathesarColumn
from db.columns.operations.infer_types import infer_column_type
from db.schemas.operations.create import create_schema
from db.tables.operations.create import CreateTableAs
from db.tables.operations.select import reflect_table
from db.types.operations.convert import get_db_type_enum_from_class


TEMP_SCHEMA = constants.INFERENCE_SCHEMA
TEMP_TABLE = f"{constants.MATHESAR_PREFIX}temp_table_%s"


def update_table_column_types(schema, table_name, engine):
    table = reflect_table(table_name, schema, engine)
    # we only want to infer (modify) the type of non-default columns
    inferable_column_names = (
        col.name for col in table.columns
        if not MathesarColumn.from_column(col).is_default
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


# TODO consider returning a mapping of column identifiers to types
def infer_table_column_types(schema, table_name, engine):
    table = reflect_table(table_name, schema, engine)

    temp_name = TEMP_TABLE % (int(time()))
    create_schema(TEMP_SCHEMA, engine)
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
        types = tuple(
            get_db_type_enum_from_class(c.type.__class__)
            for c
            in temp_table.columns
        )
        temp_table.drop()
        return types
