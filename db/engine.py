from sqlalchemy import create_engine
from db import types


def create_future_engine_with_custom_types(
        username, password, hostname, database, *args, **kwargs
):
    engine = create_future_engine(
        username, password, hostname, database, *args, **kwargs
    )
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    _add_custom_types_to_engine(engine)
    return engine


def create_future_engine(
        username, password, hostname, database, *args, **kwargs
):
    conn_str = get_postgres_conn_string(username, password, hostname, database)
    kwargs.update(future=True)
    return create_engine(conn_str, *args, **kwargs)


def get_postgres_conn_string(username, password, hostname, database):
    return f"postgresql://{username}:{password}@{hostname}/{database}"


def _add_custom_types_to_engine(engine):
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
