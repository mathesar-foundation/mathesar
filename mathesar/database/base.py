from django.conf import settings

from db import engine

DEFAULT_DB = 'default'


def create_mathesar_engine(db_name):
    """Create an SQLAlchemy engine using stored credentials."""
    import logging
    logger = logging.getLogger('create_mathesar_engine')
    logger.debug('enter')
    try:
        credentials = _get_credentials_for_db_name_in_settings(db_name)
    except KeyError:
        credentials = _get_credentials_for_db_name_not_in_settings(db_name)
    return engine.create_future_engine_with_custom_types(**credentials)


def _get_credentials_for_db_name_in_settings(db_name):
    settings_entry = settings.DATABASES[db_name]
    return dict(
        username=settings_entry["USER"],
        password=settings_entry["PASSWORD"],
        hostname=settings_entry["HOST"],
        database=settings_entry["NAME"],
        port=settings_entry["PORT"],
    )


def _get_credentials_for_db_name_not_in_settings(db_name):
    settings_entry = settings.DATABASES[DEFAULT_DB]
    return dict(
        username=settings_entry["USER"],
        password=settings_entry["PASSWORD"],
        hostname=settings_entry["HOST"],
        database=db_name,
        port=settings_entry["PORT"],
    )
