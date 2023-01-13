from mathesar.state.django import reflect_db_objects, clear_dj_cache
from mathesar.state.metadata import reset_cached_metadata, get_cached_metadata
from mathesar.state.cached_property import clear_cached_property_cache


def make_sure_initial_reflection_happened():
    if not _has_initial_reflection_happened():
        reset_reflection()


def reset_reflection(db_name=None):
    """
    Resets our reflection of what's on Postgres databases. Reset meaning that information is
    either deleted (to be refreshed on demand) or is preemptively refreshed.

    We have following forms of state (aka reflection), and all are reset by this routine:
        - Django cache (django.core.cache),
        - Django models (mathesar.models namespace),
        - SQLAlchemy MetaData.

    Note, this causes immediate calls to Postgres.
    """
    clear_dj_cache()
    clear_cached_property_cache()
    set_initial_reflection_happened()
    reset_cached_metadata()
    _trigger_django_model_reflection(db_name)


def _trigger_django_model_reflection(db_name):
    reflect_db_objects(metadata=get_cached_metadata(), db_name=db_name)


def set_initial_reflection_happened(has_it_happened=True):
    """
    Many, probably most, of our state-dependent routines presume that reflection has occured. Since
    those routines are not adapted to check whether that's true, this is a mechanism to ensure that
    at least one reflection has happened. That, together with us triggering re-reflection after
    each mutation, should keep state up-to-date.

    Only public for testing fixture purposes. Should not otherwise be called outside this file.
    """
    global _initial_reflection_happened
    _initial_reflection_happened = has_it_happened


def _has_initial_reflection_happened():
    global _initial_reflection_happened
    return _initial_reflection_happened


_initial_reflection_happened = False
