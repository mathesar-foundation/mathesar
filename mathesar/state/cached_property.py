"""
Extends the built-in property decorator in two ways:

- uses a django cache instance,
    - so that the cache may be cleared from our central state-clearing logic (principal
    motivation),
    - also, this means that the cache may be shared;
- accepts a key_fn parameter to define the cache_key,
    - a function which takes the owner as argument,
    - and, is meant to return the key identifying the item to be cached,
    - if one is not provided, the cache key is a random uuid.

Usage with a key_fn:

```
class Column:
    @key_cached_property(
        key_fn=lambda column: (
                "column name",
                column.table.database.name,
                column.table.oid,
                column.attnum,
            )
    )
    def name(self):
        ...
```

Usage without a key_fn: notice the empty `()`:

```
class Column:
    @key_cached_property()
    def name(self):
        ...
```
"""
import uuid
import logging

NO_VALUE = object()

_cache = {}

logger = logging.getLogger(__name__)


def cached_property(fn):
    return _cached_property(fn)


def key_cached_property(key_fn):
    return lambda fn: _cached_property(fn, key_fn=key_fn)


def clear_property_cache():
    logger.debug("clear_property_cache")
    global _cache
    _cache = {}


counter = 0

class _cached_property:
    def __init__(self, fn, key_fn=None):
        self.key_fn = key_fn
        self.original_get_fn = fn

    def __get__(self, instance, _):
        key = self._get_key(instance=instance)
        cached_value = _get_from_cache(key=key)
        logger.debug(f"_get_value key {key}")
        global counter
        counter += 1
        if counter > 100:
            #breakpoint()
            pass
        if cached_value is not NO_VALUE:
            logger.debug(f"_get_value cached_value {cached_value}")
            return cached_value
        else:
            assert self.original_get_fn is not None
            new_value = self.original_get_fn(instance)
            _set_on_cache(key=key, value=new_value)
            logger.debug(f"_get_value new_value {new_value}")
            return new_value

    def __set__(self, instance, value):
        key = self._get_key(instance)
        _set_on_cache(key=key, value=value)

    def __delete__(self, instance):
        key = self._get_key(instance)
        _delete_from_cache(key)

    def _get_key(self, instance):
        if self.key_fn is not None:
            key = self.key_fn(instance)
        else:
            # https://docs.python.org/3/library/uuid.html#uuid.UUID
            instance_id = id(instance)
            key = uuid.UUID(int=instance_id)
        return key

def _get_from_cache(key):
    global _cache
    return _cache.get(key, NO_VALUE)

def _set_on_cache(key, value):
    global _cache
    _cache[key] = value

def _delete_from_cache(key):
    global _cache
    _cache[key] = NO_VALUE
