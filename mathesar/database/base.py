from django.conf import settings

from db import engine


def create_mathesar_engine(db_name):
    settings_entry = settings.DATABASES[db_name]
    _make_sure_settings_entry_is_well_configured(db_name, settings_entry)
    return engine.create_future_engine_with_custom_types(
        username=settings_entry["USER"],
        password=settings_entry["PASSWORD"],
        hostname=settings_entry["HOST"],
        database=settings_entry["NAME"],
        port=settings_entry["PORT"],
    )


def _make_sure_settings_entry_is_well_configured(db_name, settings_entry):
    assert settings_entry["NAME"] == db_name
