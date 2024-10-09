import psycopg
from db import engine


def create_mathesar_engine(db_model):
    """Create an SQLAlchemy engine using stored credentials."""
    import logging
    logger = logging.getLogger('create_mathesar_engine')
    logger.debug('enter')
    credentials = _get_credentials_for_db_model(db_model)
    return engine.create_future_engine_with_custom_types(**credentials)


def _get_credentials_for_db_model(db_model):
    return dict(
        username=db_model.username,
        password=db_model.password,
        hostname=db_model.host,
        database=db_model.db_name,
        port=db_model.port,
    )
