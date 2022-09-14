from mathesar.state.django import reflect_db_objects
from mathesar.state.metadata import reset_cached_metadata, get_cached_metadata, is_metadata_cache_in_initial_state


def make_sure_initial_reflection_happened():
    if is_metadata_cache_in_initial_state():
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
