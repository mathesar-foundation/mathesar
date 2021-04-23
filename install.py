"""
This script installs functions and types for Mathesar onto the configured DB.
"""
from config.settings import DATABASES
from db import install


def main():
    for mathesar_tables_key in [key for key in DATABASES if key != "default"]:
        install_on_db_with_key(mathesar_tables_key)


def install_on_db_with_key(mathesar_tables_key):
    if DATABASES[mathesar_tables_key]["HOST"] == "db":
        # if we're going to install on the docker-created Postgres, we'll
        # create the DB
        print("Creating Mathesar DB on docker-created PostgreSQL instance")
        install.create_mathesar_database(
            DATABASES[mathesar_tables_key]["NAME"],
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
        username = DATABASES[mathesar_tables_key]["USER"]
        password = DATABASES[mathesar_tables_key]["PASSWORD"]
        host = DATABASES[mathesar_tables_key]["HOST"]
        db_name = DATABASES[mathesar_tables_key]["NAME"]
        port = DATABASES[mathesar_tables_key]["PORT"]
        print("Installing Mathesar DB on preexisting PostgreSQL instance...")
        confirmation = input(
            f"Mathesar will be installed on DB {db_name} at host {host}."
            "Confirm? (y/n) >  "
        )
        if confirmation.lower() in ["y", "yes"]:
            print("Installing...")
            install.install_mathesar_on_preexisting_database(
                DATABASES[mathesar_tables_key]["USER"],
                DATABASES[mathesar_tables_key]["PASSWORD"],
                DATABASES[mathesar_tables_key]["HOST"],
                DATABASES[mathesar_tables_key]["NAME"],
                DATABASES[mathesar_tables_key]["PORT"],
            )
        else:
            print("Skipping DB with key {mathesar_tables_key}.")


if __name__ == "__main__":
    main()
