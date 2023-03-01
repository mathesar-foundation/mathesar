from django.apps import AppConfig

TEMPLATE_INITIALIZED = 'TEMPLATE_INITIALIZED'


class DemoConfig(AppConfig):
    """Initialization manager."""

    name = "demo"

    def ready(self):
        """Perform initialization tasks."""
        pass
