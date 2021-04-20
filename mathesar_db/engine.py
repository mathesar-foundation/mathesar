from sqlalchemy import create_engine
from mathesar_db import types


def create_engine_with_custom_types(
        username, password, hostname, database, *args, **kwargs
):
    conn_str = f"postgresql://{username}:{password}@{hostname}/{database}"
    engine = create_engine(conn_str, *args, **kwargs)
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    _add_custom_types_to_engine(engine)
    return engine


def _add_custom_types_to_engine(engine):
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
