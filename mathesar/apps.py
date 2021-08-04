from django.apps import AppConfig


class MathesarConfig(AppConfig):
    name = "mathesar"

    def ready(self):
        import mathesar.signals  # noqa
