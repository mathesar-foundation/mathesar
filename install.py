"""
This script installs functions and types for Mathesar onto the configured DB.
"""
import getopt
import os
import sys

import getpass

import django
from django.contrib.auth import get_user_model

from config.settings import DATABASES
from db import install
import secrets


def main():
    skip_confirm = False
    (opts, _) = getopt.getopt(sys.argv[1:], ":s", ["skip-confirm"])
    for (opt, value) in opts:
        if (opt == "-s") or (opt == "--skip-confirm"):
            skip_confirm = True
    check_missing_dj_config()
    django.setup()
    if not superuser_exists():
        create_superuser()
    for database_key in [key for key in DATABASES if key != "default"]:
        install_on_db_with_key(database_key, skip_confirm)


def superuser_exists():
    return get_user_model().objects.filter(is_superuser=True).exists()


def create_superuser():
    username = input("Username: ")
    email = input("Email: ")
    password = getpass.getpass('Password:')
    get_user_model().objects.create_superuser(username, email, password)


def generate_secretkey():
    secret_key = secrets.token_urlsafe()
    # TODO Add documentation link
    documentation_link = ""
    print(f"Please follow the instructions in {documentation_link} to add the below secret key to the application")
    print(f"Secret Key: {secret_key}")


def check_missing_dj_config():
    try:
        os.environ.get('SECRET_KEY', None)
    except KeyError:
        generate_secretkey()
    # TODO Add documentation link
    documentation_link = ""
    try:
        os.environ['DJANGO_DATABASE_KEY']
        os.environ['DJANGO_SETTINGS_MODULE']
        os.environ['DJANGO_DATABASE_URL']
        os.environ['MATHESAR_DATABASES']
    except KeyError as e:
        missing_config_key = e.args[0]
        raise Exception(f"{missing_config_key} is missing from the config."
                        f" Please follow the documentation {documentation_link} add the missing config")


def install_on_db_with_key(database_key, skip_confirm):
    install.install_mathesar(
        user_database=DATABASES[database_key]["NAME"],
        username=DATABASES["default"]["USER"],
        password=DATABASES["default"]["PASSWORD"],
        hostname=DATABASES["default"]["HOST"],
        port=DATABASES["default"]["PORT"],
        skip_confirm=skip_confirm
    )


if __name__ == "__main__":
    main()
