from mathesar.utils import models as model_utils
from mathesar.database.base import create_mathesar_engine


# TODO: Replace with a proper form of caching
# See: https://github.com/centerofci/mathesar/issues/280
_engine_cache = {}


# TODO BUG doesn't currently account for host or port; presumes it's always the same cluster
def get_cached_engine(credentials):
    #TODO docstring
    global _engine_cache
    was_cached = credentials in _engine_cache
    if was_cached:
        engine = _engine_cache.get(credentials)
        model_utils.ensure_cached_engine_ready(engine)
    else:
        engine = create_mathesar_engine(credentials)
        _engine_cache[credentials] = engine
    return engine


#TODO explain why we're only disposing, but not removing engines (because removing might cause duplication of engines because of dispose's imperfection)
def dispose_cached_engine(credentials):
    global _engine_cache
    engine = _engine_cache.get(credentials)
    if engine:
        engine.dispose()
