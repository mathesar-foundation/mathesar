from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate


def _prepare_database_model(**kwargs):
    from mathesar.models.base import Database  # noqa
    from mathesar.state.django import sync_databases_status  # noqa
    dbs_in_settings = set(settings.DATABASES)
    # We only want to track non-django dbs
    dbs_in_settings.remove('default')
    for db_name in dbs_in_settings:
        Database.current_objects.get_or_create(name=db_name)
    if not settings.TEST:
        sync_databases_status()


class MathesarConfig(AppConfig):
    """Initialization manager."""

    name = "mathesar"

    def ready(self):
        """Perform initialization tasks."""
        import mathesar.signals  # noqa
        post_migrate.connect(_prepare_database_model)
