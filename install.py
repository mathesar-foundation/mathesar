"""
This script installs functions and types for Mathesar onto the configured DB.
"""
import getopt
import sys

from config.settings import DATABASES
from db import install


def main():
    skip_confirm = False
    (opts, _) = getopt.getopt(sys.argv[1:], ":s", ["skip-confirm"])
    for (opt, value) in opts:
        if (opt == "-s") or (opt == "--skip-confirm"):
            skip_confirm = True

    for database_key in [key for key in DATABASES if key != "default"]:
        install_on_db_with_key(database_key, skip_confirm)


def superuser_exists():
    pass


def secret_key_exists():
    pass


def create_superuser():
    pass


def generate_secretkey():
    pass


def install_on_db_with_key(database_key, skip_confirm):
    if DATABASES[database_key]["HOST"] == "mathesar_db":
        # if we're going to install on the docker-created Postgres, we'll
        # create the DB
        print("Creating Mathesar DB on docker-created PostgreSQL instance")
        install.create_mathesar_database(
            user_database=DATABASES[database_key]["NAME"],
            username=DATABASES["default"]["USER"],
            password=DATABASES["default"]["PASSWORD"],
            hostname=DATABASES["default"]["HOST"],
            root_database=DATABASES["default"]["NAME"],
            port=DATABASES["default"]["PORT"],
        )
    else:
        # if we're installing anywhere else, we require the DB to exist in
        # advance.
        username = DATABASES[database_key]["USER"]
        password = DATABASES[database_key]["PASSWORD"]
        host = DATABASES[database_key]["HOST"]
        db_name = DATABASES[database_key]["NAME"]
        port = DATABASES[database_key]["PORT"]
        print(f"Installing Mathesar DB {db_name} on preexisting PostgreSQL instance at host {host}...")
        if skip_confirm is True:
            confirmation = "y"
        else:
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
