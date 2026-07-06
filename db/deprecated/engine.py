import copy

from psycopg import ClientCursor
from sqlalchemy import BindTyping, create_engine as sa_create_engine
from sqlalchemy.dialects.postgresql import INTERVAL, DOMAIN
from sqlalchemy.dialects.postgresql.base import PGDialect
from sqlalchemy.engine import URL

from db.deprecated.types.custom import CUSTOM_DB_TYPE_TO_SA_CLASS

_CUSTOM_TYPE_BY_NAME = {}
for db_type, sa_class in CUSTOM_DB_TYPE_TO_SA_CLASS.items():
    _CUSTOM_TYPE_BY_NAME[db_type.id] = sa_class
    if '.' in db_type.id:
        _CUSTOM_TYPE_BY_NAME[db_type.id.split('.', 1)[1]] = sa_class


_original_reflect_type = PGDialect._reflect_type


def _patched_reflect_type(self, *args, **kwargs):
    coltype = _original_reflect_type(self, *args, **kwargs)

    if isinstance(coltype, INTERVAL):
        interval_cls = _CUSTOM_TYPE_BY_NAME.get('interval')
        if interval_cls is not None:
            coltype = interval_cls(precision=coltype.precision, fields=coltype.fields)
    elif isinstance(coltype, DOMAIN):
        custom_cls = _CUSTOM_TYPE_BY_NAME.get(coltype.name)
        if custom_cls is not None:
            coltype = custom_cls()

    return coltype


PGDialect._reflect_type = _patched_reflect_type


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
    query = {}
    if hostname.startswith("/"):
        query = {"host": hostname}
        hostname = None
    # SA 2.0 URL.create rejects empty string for port
    if port == '':
        port = None
    conn_url = URL.create(
        "postgresql+psycopg",
        username=username,
        password=password,
        host=hostname,
        database=database,
        port=port,
        query=query,
    )
    return create_engine(conn_url, *args, **kwargs)

# NOTE: used in testing, hence public
def create_engine(conn_url, *args, **kwargs):
    """
    Wrapper over sqlalchemy.create_engine that stops SA from propagating changes to ischema_names
    across all engines. This is important for testing: without this intervention, fixtures become
    randomly corrupted.
    """
    kwargs.update(
        connect_args={
            "application_name": "Mathesar db.deprecated.engine.create_future_engine",
            "cursor_factory": ClientCursor,
        },
        pool_size=2,
    )
    engine = sa_create_engine(conn_url, *args, **kwargs)
    engine.dialect.bind_typing = BindTyping.NONE
    _make_ischema_names_unique(engine)
    return engine


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
    engine = create_engine("postgresql+psycopg://")
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
