from db.metadata import get_empty_metadata
from mathesar.reflection import reflect_db_objects


def make_sure_initial_reflection_happened():
    if _is_metadata_cache_in_initial_state():
        reset_reflection()


def reset_reflection():
    """
    Resets our reflection of what's on Postgres databases.

    We have two forms of state (aka reflection), and both are reset by this routine. The two forms
    of reflection are Django models representing database objects (mathesar.models namespace), and
    SQLAlchemy MetaData. Note, this causes immediate calls to Postgres.
    """
    reset_cached_metadata()
    _trigger_django_model_reflection()


def _trigger_django_model_reflection():
    reflect_db_objects(metadata=get_cached_metadata())


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


def _is_metadata_cache_in_initial_state():
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
