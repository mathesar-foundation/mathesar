from django.conf import settings

from db import engine


def create_mathesar_engine(database):
    return engine.create_future_engine_with_custom_types(
        settings.DATABASES[database]["USER"],
        settings.DATABASES[database]["PASSWORD"],
        settings.DATABASES[database]["HOST"],
        settings.DATABASES[database]["NAME"],
        settings.DATABASES[database]["PORT"],
    )
