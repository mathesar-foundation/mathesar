import uuid
import logging

# A globally unique object that's used to signal a cache-miss.
NO_VALUE = object()

logger = logging.getLogger(__name__)


def cached_property(fn):
    """
    Caches property values, similarly to django.utils.functional.cached_property, but in a central
    cache, which means we can clear all property caches via a central method call, which is
    necessary for managing our state.
    """
    return _cached_property(fn)


def key_cached_property(key_fn):
    """
    Like cached_property, but takes a key_fn, which is expected to be a function that takes the
    instance on which this property is accessed and returns a key that this property should use
    when indexing in the central cache.
    """
    return lambda fn: _cached_property(fn, key_fn=key_fn)


def clear_cached_property_cache():
    """
    Clear caches of all cached properties.
    """
    logger.debug("clear_cached_property_cache")
    global _central_ache
    _central_cache = {}  # noqa: F841


class _cached_property:
    def __init__(self, fn, key_fn=None):
        self.key_fn = key_fn
        self.original_get_fn = fn
        self.attribute_name = None

    def __set_name__(self, _, name):
        """
        Make note of the attribute name.
        """
        if self.attribute_name is None:
            self.attribute_name = name
        elif name != self.attribute_name:
            raise TypeError(
                "Cannot assign the same cached_property to two different names "
                f"({self.attribute_name!r} and {name!r})."
            )

    def __get__(self, instance, _):
        key = self._get_ip_key(instance=instance)
        cached_value = _get_from_central_cache(key=key)
        if cached_value is not NO_VALUE:
            return cached_value
        else:
            assert self.original_get_fn is not None
            new_value = self.original_get_fn(instance)
            _set_on_central_cache(key=key, value=new_value)
            return new_value

    def __set__(self, instance, value):
        key = self._get_ip_key(instance)
        _set_on_central_cache(key=key, value=value)

    def __delete__(self, instance):
        key = self._get_ip_key(instance)
        _delete_from_central_cache(key)

    def _get_ip_key(self, instance):
        """
        Gets an instance-and-property-specific key (abbreviated instance-property key or ip key)
        for indexing in the central cache.
        """
        if self._should_derive_ip_keys_from_key_fn():
            ip_key = self._get_key_fn_derived_ip_key(instance)
        else:
            ip_key = self._get_random_ip_key(instance)
        return ip_key

    def _should_derive_ip_keys_from_key_fn(self):
        """
        If a key_fn is provided, it will always be used for deriving ip keys.
        """
        return self.key_fn is not None

    def _get_key_fn_derived_ip_key(self, instance):
        """
        Calls the key_fn with the instance. That is expected to produce a hashable key that will be
        used for indexing in the central cache. Allows sharing the same central cache entry
        between multiple pieces of code (not necessarily properties).

        NOTE key_fn-derived ip keys are not cached, because we don't have a mechanism for
        re-triggering ip key generation. We could implement that via a flag that would be
        reset by a `mathesar.state.reset_reflection()` call. However, key_fn calls are currently
        cheap.
        """
        if self.key_fn is not None:
            ip_key = self.key_fn(instance)
            return ip_key

    def _get_random_ip_key(self, instance):
        """
        Gets a random ip key. No cache-sharing possible.
        """
        # https://docs.python.org/3/library/uuid.html#uuid.uuid4
        ip_key = self._get_ip_key_from_instance_cache(instance)
        if ip_key is not NO_VALUE:
            return ip_key
        else:
            ip_key = uuid.uuid4()
            self._set_ip_key_on_instance_cache(instance, ip_key)
            return ip_key

    def _get_ip_key_from_instance_cache(self, instance):
        """
        Get the instance-and-property-specific central cache key that's cached on this instance.
        """
        property_key = self._get_property_key()
        instance_cache = self._get_instance_cache(instance)
        return instance_cache.get(property_key, NO_VALUE)

    def _set_ip_key_on_instance_cache(self, instance, ip_key):
        property_key = self._get_property_key()
        instance_cache = self._get_instance_cache(instance)
        instance_cache[property_key] = ip_key

    def _get_instance_cache(self, instance):
        """
        An instance cache is an instance-specific cache whose purpose is to hold the
        instance-and-property-specific keys to the central cache. It holds the central cache keys indexed by
        property-specific keys (see _get_property_key).
        """
        return instance.__dict__

    def _get_property_key(self):
        """
        This key is property-specific (e.g. the Column name property), but not instance-specific.
        Together with the instance cache, it let's you store instance-and-property-specific central
        cache keys.
        """
        return f'_property_key__{self.attribute_name}'


def _get_from_central_cache(key):
    global _central_cache
    return _central_cache.get(key, NO_VALUE)


def _set_on_central_cache(key, value):
    global _central_cache
    _central_cache[key] = value


def _delete_from_central_cache(key):
    global _central_cache
    _central_cache[key] = NO_VALUE


_central_cache = {}
