from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db import engine
from db.sql import install as sql_install
from db.types import install as types_install


def install_mathesar(
        name, db_username, db_password, db_host, db_port, skip_confirm
):
    """Create database and install Mathesar on it."""
    user_db_engine = engine.create_future_engine(
        db_username, db_password, db_host, name, db_port,
        connect_args={"connect_timeout": 10}
    )
    try:
        user_db_engine.connect()
        print(f"Installing Mathesar on preexisting PostgreSQL database {name} at host {db_host}...")
        sql_install.install(user_db_engine)
        types_install.install_mathesar_on_database(user_db_engine)
        user_db_engine.dispose()
    except OperationalError:
        database_created = _create_database(
            name,
            db_username,
            db_password,
            db_host,
            db_port,
            skip_confirm=skip_confirm
        )
        if database_created:
            print(f"Installing Mathesar on PostgreSQL database {name} at host {db_host}...")
            sql_install.install(user_db_engine)
            types_install.install_mathesar_on_database(user_db_engine)
            user_db_engine.dispose()
        else:
            print(f"Skipping installing on DB with key {name}.")


def _create_database(name, db_username, db_password, db_host, db_port, skip_confirm=True):
    if skip_confirm is True:
        create_database = "y"
    else:
        create_database = input(
            f"Create a new Database called {name}? (y/n) > "
        )
    if create_database.lower() in ["y", "yes"]:
        # We need to connect to an existing database inorder to create a new Database.
        # So we use the default Database `postgres` that comes with postgres.
        # TODO Throw correct error when the default postgres database does not exists(which is very rare but still possible)
        root_database = "postgres"
        root_db_engine = engine.create_future_engine(
            db_username, db_password, db_host, root_database, db_port,
            connect_args={"connect_timeout": 10}
        )
        with root_db_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f'CREATE DATABASE "{name}"'))
        root_db_engine.dispose()
        print(f"Created DB is {name}.")
        return True
    else:
        print(f"Database {name} not created!")
        return False
