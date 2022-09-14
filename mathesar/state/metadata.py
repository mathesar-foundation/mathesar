from db.metadata import get_empty_metadata


def get_cached_metadata():
    """
    Cached to minimize reflection queries to Postgres.
    """
    global _metadata_cache
    return _metadata_cache


def reset_cached_metadata():
    """
    Resets MetaData cache to empty.
    """
    global _metadata_cache
    metadata = get_empty_metadata()
    _metadata_cache = metadata


def is_metadata_cache_in_initial_state():
    global _metadata_cache
    return _metadata_cache == _get_initial_metadata_cache_state()


def _get_initial_metadata_cache_state():
    """
    MetaData cache is initially None. After the first reflection is performed, it will never be
    reset back to None. Instead, when the MetaData cache is reset/cleared, its value is just an
    empty instance of MetaData. The purpose of the `None` state is to signal that the initial
    reflection has not happened yet.
    """
    return None


_metadata_cache = _get_initial_metadata_cache_state()
