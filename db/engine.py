from sqlalchemy import create_engine
from db import types


def create_future_engine_with_custom_types(
        username, password, hostname, database, port, *args, **kwargs
):
    engine = create_future_engine(
        username, password, hostname, database, port, *args, **kwargs
    )
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    _add_custom_types_to_engine(engine)
    return engine


def create_future_engine(
        username, password, hostname, database, port, *args, **kwargs
):
    conn_str = f"postgresql://{username}:{password}@{hostname}/{database}"
    kwargs.update(future=True)
    return create_engine(conn_str, *args, **kwargs)


def _add_custom_types_to_engine(engine):
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
