from django.conf import settings

from db import engine


def create_mathesar_engine(database_key):
    return engine.create_future_engine_with_custom_types(
        settings.DATABASES[database_key]["USER"],
        settings.DATABASES[database_key]["PASSWORD"],
        settings.DATABASES[database_key]["HOST"],
        settings.DATABASES[database_key]["NAME"],
        settings.DATABASES[database_key]["PORT"],
    )
