from db.metadata import get_empty_metadata


def get_metadata():
    """
    Cached to minimize reflection queries to Postgres.
    """
    return _metadata_cache


def clear_metadata():
    """
    Clears MetaData cache by replacing it with a an empty instance and returns it.
    """
    global _metadata_cache
    _metadata_cache = get_empty_metadata()
    return _metadata_cache


_metadata_cache = get_empty_metadata()
