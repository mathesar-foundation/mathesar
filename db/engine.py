from sqlalchemy import create_engine
from db.types.custom.base import CUSTOM_DB_TYPE_TO_SA_CLASS


def get_connection_string(username, password, hostname, database, port='5432'):
    return f"postgresql://{username}:{password}@{hostname}:{port}/{database}"


def create_future_engine_with_custom_types(
        username, password, hostname, database, port, *args, **kwargs
):
    engine = create_future_engine(
        username, password, hostname, database, port, *args, **kwargs
    )
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    add_custom_types_to_ischema_names(engine)
    return engine


def create_future_engine(
        username, password, hostname, database, port, *args, **kwargs
):
    conn_str = get_connection_string(
        username, password, hostname, database, port
    )
    kwargs.update(future=True)
    return create_engine(conn_str, *args, **kwargs)


def add_custom_types_to_ischema_names(engine):
    """
    Updating the ischema_names dict changes which Postgres types are reflected into which SA
    classes.
    """
    for db_type, sa_class in CUSTOM_DB_TYPE_TO_SA_CLASS.items():
        db_type_id = db_type.id
        engine.dialect.ischema_names[db_type_id] = sa_class
