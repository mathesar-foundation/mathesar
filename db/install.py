import psycopg
from psycopg.errors import OperationalError, InsufficientPrivilege
from psycopg import sql

from db.sql import install as sql_install


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

    try:
        conn = psycopg.connect(
            host=hostname,
            port=port,
            dbname=database_name,
            user=username,
            password=password,
        )
        print(
            "Installing Mathesar on preexisting PostgreSQL database"
            f" {database_name} at host {hostname}..."
        )
        with conn:
            sql_install.install(conn)

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
            conn = psycopg.connect(
                host=hostname,
                port=port,
                dbname=database_name,
                user=username,
                password=password,
            )
            print(
                "Installing Mathesar on PostgreSQL database"
                f" {database_name} at host {hostname}..."
            )
            with conn:
                sql_install.install(conn)
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
        root_db_conn = psycopg.connect(
            host=hostname,
            port=port,
            dbname=root_database,
            user=username,
            password=password,
        )
        try:
            with root_db_conn as conn:
                cursor = conn.cursor()
                conn.autocommit = True
                cursor.execute(sql.SQL(f'CREATE DATABASE "{db_name}"'))
                cursor.close()
            print(f"Created DB is {db_name}.")
            return True
        except InsufficientPrivilege:
            print(f"Database {db_name} could not be created due to Insufficient Privilege")
            return False
        except Exception:
            print(f"Database {db_name} could not be created!")
            return False
    else:
        print(f"Database {db_name} not created!")
        return False
