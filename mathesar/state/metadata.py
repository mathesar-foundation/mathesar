from db.metadata import get_empty_metadata
from django_request_cache import cache_for_request


@cache_for_request
def get_cached_metadata():
    """
    Cached to minimize reflection queries to Postgres.
    """
    return _metadata_cache


def reset_cached_metadata():
    """
    Resets MetaData cache to empty.
    """
    global _metadata_cache
    _metadata_cache = get_empty_metadata()


_metadata_cache = get_empty_metadata()
