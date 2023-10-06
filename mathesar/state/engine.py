from mathesar.utils import models as model_utils
from mathesar.database.base import create_mathesar_engine


_engine_cache = {}


def get_cached_engine(credentials):
    """
    Returns a cached engine for connecting using these credentials.

    Makes presumption that the credentials (db.credentials.DbCredentials) are
    enough to uniquely identify a cached connection pool (which is what
    SQLAlchemy's Engine essentially is).
    """
    global _engine_cache
    was_cached = credentials in _engine_cache
    if was_cached:
        engine = _engine_cache.get(credentials)
        model_utils.ensure_cached_engine_ready(engine)
    else:
        engine = create_mathesar_engine(credentials)
        _engine_cache[credentials] = engine
    return engine


def dispose_cached_engine(credentials):
    """
    Does some degree of garbage collection on a cached engine.

    Note, it would be intuitive here to just remove the cached engine from the
    cache entirely (in addition to calling its dispose method, but in my (Dom's)
    anecdotal experience that's how you get connection leaks. I might very well
    be wrong.
    """
    global _engine_cache
    engine = _engine_cache.get(credentials)
    if engine:
        engine.dispose()
