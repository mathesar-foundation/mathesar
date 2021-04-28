"""
This script installs functions and types for Mathesar onto the configured DB.
"""
from config.settings import DATABASES
from db import install


def main():
    for database_key in [key for key in DATABASES if key != "default"]:
        install_on_db_with_key(database_key)


def install_on_db_with_key(database_key):
    if DATABASES[database_key]["HOST"] == "db":
        # if we're going to install on the docker-created Postgres, we'll
        # create the DB
        print("Creating Mathesar DB on docker-created PostgreSQL instance")
        install.create_mathesar_database(
            DATABASES[database_key]["NAME"],
            DATABASES["default"]["USER"],
            DATABASES["default"]["PASSWORD"],
            DATABASES["default"]["HOST"],
            DATABASES["default"]["NAME"],
            DATABASES["default"]["PORT"],
        )
        print(f"Created DB is {DATABASES['mathesar_tables']['NAME']}")
    else:
        # if we're installing anywhere else, we require the DB to exist in
        # advance.
        username = DATABASES[database_key]["USER"]
        password = DATABASES[database_key]["PASSWORD"]
        host = DATABASES[database_key]["HOST"]
        db_name = DATABASES[database_key]["NAME"]
        port = DATABASES[database_key]["PORT"]
        print("Installing Mathesar DB on preexisting PostgreSQL instance...")
        confirmation = input(
            f"Mathesar will be installed on DB {db_name} at host {host}."
            "Confirm? (y/n) >  "
        )
        if confirmation.lower() in ["y", "yes"]:
            print("Installing...")
            install.install_mathesar_on_preexisting_database(
                username,
                password,
                host,
                db_name,
                port,
            )
        else:
            print("Skipping DB with key {database_key}.")


if __name__ == "__main__":
    main()
