from django.conf import settings
from db import engine


def create_mathesar_engine():
    return engine.create_engine_with_custom_types(
        settings.DATABASES["default"]["USER"],
        settings.DATABASES["default"]["PASSWORD"],
        settings.DATABASES["default"]["HOST"],
        settings.DATABASES["default"]["NAME"],
        future=True,
    )
