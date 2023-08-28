from django.conf import settings

from demo.utils import get_is_live_demo_mode

from db import engine
DEFAULT_DB = 'default'


def create_mathesar_engine(db_model):
    """Create an SQLAlchemy engine using stored credentials."""
    import logging
    logger = logging.getLogger('create_mathesar_engine')
    logger.debug('enter')
    try:
        credentials = _get_credentials_for_db_name_in_settings(db_model)
    except KeyError:
        if get_is_live_demo_mode():
            credentials = _get_credentials_for_db_name_not_in_settings(db_model)
        else:
            raise
    return engine.create_future_engine_with_custom_types(**credentials)


def _get_credentials_for_db_name_in_settings(db_model):
    return dict(
        username=db_model.db_username,
        password=db_model.db_password,
        hostname=db_model.db_host,
        database=db_model.name,
        port=db_model.db_port,
    )


def _get_credentials_for_db_name_not_in_settings(db_model):
    return dict(
        username=db_model.db_username,
        password=db_model.db_password,
        hostname=db_model.db_host,
        database=db_model.name,
        port=db_model.db_port,
    )
