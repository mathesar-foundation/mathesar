from db import engine
from db.credentials import DbCredentials


def create_mathesar_engine(credentials):
    """Create an SQLAlchemy engine using stored credentials."""
    assert type(credentials) is DbCredentials
    import logging
    logger = logging.getLogger('create_mathesar_engine')
    logger.debug('enter')
    return engine.create_future_engine_with_custom_types(credentials)
