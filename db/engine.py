import copy

from sqlalchemy import create_engine as sa_create_engine
from sqlalchemy.engine import URL

from db.types.custom.base import CUSTOM_DB_TYPE_TO_SA_CLASS


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


# TODO would an engine without ischema names updated ever be used? make it private if not
def create_future_engine(
        username, password, hostname, database, port, *args, **kwargs
):
    conn_url = URL.create(
        "postgresql",
        username=username,
        password=password,
        host=hostname,
        database=database,
        port=port,
    )
    kwargs.update(future=True)
    return create_engine(conn_url, *args, **kwargs)


# NOTE: used in testing, hence public
def create_engine(conn_url, *args, **kwargs):
    """
    Wrapper over sqlalchemy.create_engine that stops SA from propagating changes to ischema_names
    across all engines. This is important for testing: without this intervention, fixtures become
    randomly corrupted.
    """
    engine = sa_create_engine(conn_url, *args, **kwargs)
    _make_ischema_names_unique(engine)
    return engine


# TODO should refactor for this to be private
def add_custom_types_to_ischema_names(engine):
    """
    Updating the ischema_names dict changes which Postgres types are reflected into which SA
    classes.
    """
    for db_type, sa_class in CUSTOM_DB_TYPE_TO_SA_CLASS.items():
        db_type_id = db_type.id
        engine.dialect.ischema_names[db_type_id] = sa_class


def get_dummy_engine():
    """
    In some cases we only need an engine to access the Postgres dialect. E.g. when examining the
    ischema_names dict. In those cases, following is enough:
    """
    engine = create_engine("postgresql://", future=True)
    add_custom_types_to_ischema_names(engine)
    return engine


def _make_ischema_names_unique(engine):
    """
    For some reason, engine.dialect.ischema_names reference the same dict across different engines.
    This resets it to a referentially unique copy of itself.
    """
    ischema_names = engine.dialect.ischema_names
    ischema_names_copy = copy.deepcopy(ischema_names)
    setattr(engine.dialect, "ischema_names", ischema_names_copy)
