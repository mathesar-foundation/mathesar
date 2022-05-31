from sqlalchemy import text

from db import engine
from db.types import install


def create_mathesar_database(
        user_database, username, password, hostname, root_database, port,
):
    root_db_engine = engine.create_future_engine(
        username, password, hostname, root_database, port,
    )
    with root_db_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"CREATE DATABASE {user_database}"))
    user_db_engine = engine.create_future_engine(
        username, password, hostname, user_database, port
    )
    install.install_mathesar_on_database(user_db_engine)
    user_db_engine.dispose()
    root_db_engine.dispose()


def install_mathesar_on_preexisting_database(
        username, password, hostname, database, port,
):
    user_db_engine = engine.create_future_engine(
        username, password, hostname, database, port
    )
    install.install_mathesar_on_database(user_db_engine)
    user_db_engine.dispose()
