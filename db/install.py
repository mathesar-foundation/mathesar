from psycopg.errors import InsufficientPrivilege
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

from db import engine
from db.sql import install as sql_install
from db.types import install as types_install


# TODO would be nice to use this in conftest.py to setup our tests, but it's a
# bit too complicated for that: as of writing, it might create a db, has logic
# for interactive user input, etc.; if someone's interested in splitting this
# up, would be nice!
def install_mathesar(
    credentials, skip_confirm=True
):
    """Create database and install Mathesar on it."""
    db_name = credentials.db_name
    hostname = credentials.hostname
    user_db_engine = engine.create_future_engine(
        credentials,
        # TODO explain why a custom timeout is needed; this keeps this method
        # from being compatible with cached engines, used in tests, etc.
        connect_args={"connect_timeout": 10}
    )
    try:
        user_db_engine.connect()
        print(f"Installing Mathesar on preexisting PostgreSQL database {db_name} at host {hostname}...")
        sql_install.install(user_db_engine)
        types_install.install_mathesar_on_database(user_db_engine)
    except OperationalError:
        database_created = _create_database(
            credentials,
            skip_confirm=skip_confirm
        )
        if database_created:
            print(f"Installing Mathesar on PostgreSQL database {db_name} at host {hostname}...")
            sql_install.install(user_db_engine)
            types_install.install_mathesar_on_database(user_db_engine)
        else:
            print(f"Skipping installing on DB with key {db_name}.")
    finally:
        user_db_engine.dispose()


def _create_database(credentials, skip_confirm=True):
    db_name = credentials.db_name
    if skip_confirm is True:
        create_database = "y"
    else:
        create_database = input(
            f"Create a new Database called {db_name}? (y/n) > "
        )
    if create_database.lower() in ["y", "yes"]:
        # We need to connect to an existing database inorder to create a new Database.
        # So we use the default database `postgres` that comes with postgres.
        # TODO Throw correct error when the default postgres database does not exists(which is very rare but still possible)
        root_credentials = credentials.get_root()
        root_db_engine = engine.create_future_engine(
            root_credentials,
            connect_args={"connect_timeout": 10}
        )
        try:
            with root_db_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print(f"Created DB is {db_name}.")
            return True
        except ProgrammingError as e:
            if isinstance(e.orig, InsufficientPrivilege):
                print(f"Database {db_name} could not be created due to Insufficient Privilege")
                return False
        except Exception:
            print(f"Database {db_name} could not be created!")
            return False
        finally:
            root_db_engine.dispose()
    else:
        print(f"Database {db_name} not created!")
        return False
