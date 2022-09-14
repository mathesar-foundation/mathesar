from db.metadata import get_empty_metadata
from mathesar.reflection import reflect_db_objects


def get_cached_metadata():
    """
    Cached to minimize reflection queries to Postgres. If the cache is empty (None), causes a full
    reflection of database state.
    """
    global _metadata_cache
    if _metadata_cache is None:
        metadata = get_empty_metadata()
        reflect_db_objects(metadata=metadata)
        _metadata_cache = metadata
    return _metadata_cache


def clear_cached_metadata():
    """
    Clears MetaData cache by resetting it to None.
    """
    global _metadata_cache
    _metadata_cache = None


_metadata_cache = None
