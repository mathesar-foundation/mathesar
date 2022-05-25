from django.conf import settings

from db import engine


def create_mathesar_engine(db_name):
    settings_entry = settings.DATABASES[db_name]
    return engine.create_future_engine_with_custom_types(
        username=settings_entry["USER"],
        password=settings_entry["PASSWORD"],
        hostname=settings_entry["HOST"],
        database=settings_entry["NAME"],
        port=settings_entry["PORT"],
    )
