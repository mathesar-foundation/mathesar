from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db import engine
from db.types import install


def install_mathesar(
        user_database, username, password, hostname, port, skip_confirm
):
    """Create database and install Mathesar on it."""
    user_db_engine = engine.create_future_engine(
        username, password, hostname, user_database, port
    )
    try:
        user_db_engine.connect()
        print(f"Installing Mathesar on preexisting PostgreSQL database {user_database} at host {hostname}...")
        install.install_mathesar_on_database(user_db_engine)
        user_db_engine.dispose()
    except OperationalError:
        database_created = create_mathesar_database(
            hostname,
            password,
            port,
            user_database,
            user_db_engine,
            username,
            skip_confirm
        )
        if database_created:
            print(f"Installing Mathesar on PostgreSQL database {user_database} at host {hostname}...")
            install.install_mathesar_on_database(user_db_engine)
            user_db_engine.dispose()
        else:
            print(f"Skipping installing on DB with key {user_database}.")


def create_mathesar_database(hostname, password, port, user_database, user_db_engine, username, skip_confirm):
    if skip_confirm is True:
        create_database = "y"
    else:
        create_database = input(
            f"Create a new Database called {user_database}? (y/n) > "
        )
    if create_database.lower() in ["y", "yes"]:
        # We need to connect to an existing database inorder to create a new Database.
        # So we use the default Database `postgres` that comes with postgres.
        # TODO Throw correct error when the default postgres database does not exists(which is very rare but still possible)
        root_database = "postgres"
        root_db_engine = engine.create_future_engine(
            username, password, hostname, root_database, port,
        )
        with root_db_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f"CREATE DATABASE {user_database}"))
        root_db_engine.dispose()
        print(f"Created DB is {user_database}.")
        return True
    else:
        print(f"Database {user_database} not created!")
        return False
