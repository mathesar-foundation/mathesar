from mathesar.state.django import reflect_db_objects
from mathesar.state.metadata import reset_cached_metadata, get_cached_metadata


import logging
logger = logging.getLogger(__name__)
def make_sure_initial_reflection_happened():
    logger.debug(f"make_sure_initial_reflection_happened")
    if not _has_initial_reflection_happened():
        logger.debug(f"make_sure_initial_reflection_happened reset_reflection()")
        reset_reflection()


def reset_reflection():
    """
    Resets our reflection of what's on Postgres databases. Reset meaning that information is
    either deleted (to be refreshed on demand) or is preemptively refreshed.

    We have two forms of state (aka reflection), and both are reset by this routine. The two forms
    of reflection are Django models representing database objects (mathesar.models namespace), and
    SQLAlchemy MetaData. Note, this causes immediate calls to Postgres.
    """
    set_initial_reflection_happened()
    reset_cached_metadata()
    _trigger_django_model_reflection()


def _trigger_django_model_reflection():
    reflect_db_objects(metadata=get_cached_metadata())



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
