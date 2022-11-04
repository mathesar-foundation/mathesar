from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db import engine
from db.types import install


def create_mathesar_database(
        user_database, username, password, hostname, root_database, port,
):
    """Create database and install Mathesar on it."""
    user_db_engine = engine.create_future_engine(
        username, password, hostname, user_database, port
    )
    try:
        user_db_engine.connect()
        user_db_engine.dispose()
        print(f"Database {user_database} already exists! Skipping...")
    except OperationalError:
        root_db_engine = engine.create_future_engine(
            username, password, hostname, root_database, port,
        )
        with root_db_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f"CREATE DATABASE {user_database}"))
        install.install_mathesar_on_database(user_db_engine)
        root_db_engine.dispose()
        user_db_engine.dispose()
        print(f"Created DB is {user_database}.")


def install_mathesar_on_preexisting_database(
        username, password, hostname, database, port,
):
    user_db_engine = engine.create_future_engine(
        username, password, hostname, database, port
    )
    install.install_mathesar_on_database(user_db_engine)
    user_db_engine.dispose()
