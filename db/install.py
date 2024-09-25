from psycopg.errors import InsufficientPrivilege
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

from db import engine
from db.sql import install as sql_install
from db.types import install as types_install


def install_mathesar(
        database_name,
        username,
        password,
        hostname,
        port,
        skip_confirm,
        create_db=True,
        root_db='postgres'
):
    """Create database and install Mathesar on it."""
    user_db_engine = engine.create_future_engine(
        username, password, hostname, database_name, port,
        connect_args={"connect_timeout": 10}
    )
    try:
        user_db_engine.connect()
        print(
            "Installing Mathesar on preexisting PostgreSQL database"
            f" {database_name} at host {hostname}..."
        )
        types_install.install_mathesar_on_database(user_db_engine)
        sql_install.install(user_db_engine)
        user_db_engine.dispose()
    except OperationalError as e:
        if create_db:
            database_created = _create_database(
                db_name=database_name,
                hostname=hostname,
                username=username,
                password=password,
                port=port,
                skip_confirm=skip_confirm,
                root_database=root_db
            )
        else:
            database_created = False
        if database_created:
            print(
                "Installing Mathesar on PostgreSQL database"
                f" {database_name} at host {hostname}..."
            )
            types_install.install_mathesar_on_database(user_db_engine)
            sql_install.install(user_db_engine)
            user_db_engine.dispose()
        else:
            print(f"Skipping installing on DB with key {database_name}.")
            raise e


def _create_database(
        db_name, hostname, username, password, port, skip_confirm, root_database
):
    if skip_confirm is True:
        create_database = "y"
    else:
        create_database = input(
            f"Create a new Database called {db_name}? (y/n) > "
        )
    if create_database.lower() in ["y", "yes"]:
        # We need to connect to an existing database inorder to create a new
        # Database.  So we use the default database `postgres` that comes with
        # postgres.
        # TODO Throw correct error when the root database does not exist.
        root_db_engine = engine.create_future_engine(
            username, password, hostname, root_database, port,
            connect_args={"connect_timeout": 10}
        )
        try:
            with root_db_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            root_db_engine.dispose()
            print(f"Created DB is {db_name}.")
            return True
        except ProgrammingError as e:
            if isinstance(e.orig, InsufficientPrivilege):
                print(f"Database {db_name} could not be created due to Insufficient Privilege")
                return False
        except Exception:
            print(f"Database {db_name} could not be created!")
            return False
    else:
        print(f"Database {db_name} not created!")
        return False
