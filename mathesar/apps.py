from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate


def _prepare_database_model(**kwargs):
    from mathesar.state import make_sure_initial_reflection_happened  # noqa
    # TODO fix test DB loading to make this unnecessary
    if not settings.TEST:
        make_sure_initial_reflection_happened()


class MathesarConfig(AppConfig):
    """Initialization manager."""

    name = "mathesar"

    def ready(self):
        """Perform initialization tasks."""
        post_migrate.connect(_prepare_database_model)
