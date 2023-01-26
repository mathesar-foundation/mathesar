from time import time

from sqlalchemy import select

from db import constants
from db.columns.base import MathesarColumn
from db.columns.operations.infer_types import infer_column_type
from db.schemas.operations.create import create_schema
from db.tables.operations.create import CreateTableAs
from db.tables.operations.select import reflect_table
from db.types.operations.convert import get_db_type_enum_from_class
from db.metadata import get_empty_metadata


TEMP_SCHEMA = constants.INFERENCE_SCHEMA
TEMP_TABLE = f"{constants.MATHESAR_PREFIX}temp_table_%s"


def update_table_column_types(schema, table_name, engine, metadata=None, columns_might_have_defaults=True):
    metadata = metadata if metadata else get_empty_metadata()
    table = reflect_table(table_name, schema, engine, metadata=metadata)
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
            metadata=metadata,
            columns_might_have_defaults=columns_might_have_defaults,
        )


# TODO consider returning a mapping of column identifiers to types
def infer_table_column_types(schema, table_name, engine, metadata=None, columns_might_have_defaults=True):
    pr = _start_profiling()
    metadata = metadata if metadata else get_empty_metadata()
    table = reflect_table(table_name, schema, engine, metadata=metadata)

    temp_name = TEMP_TABLE % (int(time()))
    create_schema(TEMP_SCHEMA, engine)
    with engine.begin() as conn:
        while engine.dialect.has_table(conn, temp_name, schema=TEMP_SCHEMA):
            temp_name = TEMP_TABLE.format(int(time()))

    full_temp_name = f"{TEMP_SCHEMA}.{temp_name}"

    select_table = select(table)
    with engine.begin() as conn:
        conn.execute(CreateTableAs(full_temp_name, select_table))
    temp_table = reflect_table(temp_name, TEMP_SCHEMA, engine, metadata=metadata)

    try:
        update_table_column_types(
            TEMP_SCHEMA,
            temp_table.name,
            engine=engine,
            metadata=metadata,
            columns_might_have_defaults=columns_might_have_defaults,
        )
    except Exception as e:
        # Ensure the temp table is deleted
        temp_table.drop(bind=engine)
        _stop_profiling(pr)
        raise e
    else:
        temp_table = reflect_table(temp_name, TEMP_SCHEMA, engine, metadata=metadata)
        types = tuple(
            get_db_type_enum_from_class(c.type.__class__)
            for c
            in temp_table.columns
        )
        temp_table.drop(bind=engine)
        _stop_profiling(pr)
        return types


def _start_profiling():
    print("started profiling")
    import cProfile
    pr = cProfile.Profile()
    pr.enable()
    return pr

def _stop_profiling(pr):
    pr.disable()
    from datetime import datetime
    now_str = str(datetime.utcnow())
    profile_file_name = f"infer_column_types_profile {now_str}"
    print(f"stopped profiling, dumping to: {profile_file_name}")
    pr.dump_stats(profile_file_name)
