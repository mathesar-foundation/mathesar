"""
This script installs functions and types for Mathesar onto the configured DB.
"""
import getopt
import sys

import getpass

import django
from decouple import UndefinedValueError, config as decouple_config
from django.contrib.auth import get_user_model
from django.core import management

from django.conf import settings
from db import install


def main():
    skip_confirm = False
    (opts, _) = getopt.getopt(sys.argv[1:], ":s", ["skip-confirm"])
    for (opt, value) in opts:
        if (opt == "-s") or (opt == "--skip-confirm"):
            skip_confirm = True
    check_missing_dj_config()
    django.setup()
    management.call_command('migrate')
    debug_mode = decouple_config('DEBUG', default=False, cast=bool)
    #
    if not debug_mode:
        management.call_command('collectstatic', no_input='y')
    if not superuser_exists():
        print("------------Setting up Admin user------------")
        print("Admin user does not exists. We need at least one admin")
        create_superuser(skip_confirm)

    print("------------Setting up User Databases------------")
    user_databases = [key for key in settings.DATABASES if key != "default"]
    for database_key in user_databases:
        install_on_db_with_key(database_key, skip_confirm)


def superuser_exists():
    return get_user_model().objects.filter(is_superuser=True).exists()


def create_superuser(skip_confirm):
    # TODO Replace argument name used for default admin user creation.
    if not skip_confirm:
        print("Please enter the details to create a new admin user ")
        username = input("Username: ")
        email = input("Email: ")
        password = getpass.getpass('Password: ')
    else:
        username = "admin"
        email = "admin@example.com"
        password = "password"
    get_user_model().objects.create_superuser(username, email, password)
    print(f"Admin user with username {username} was created successfully")


def check_missing_dj_config():
    # TODO Add documentation link
    documentation_link = ""
    try:
        decouple_config('ALLOWED_HOSTS')
        decouple_config('SECRET_KEY')
        decouple_config('DJANGO_DATABASE_KEY')
        decouple_config('DJANGO_SETTINGS_MODULE')
        decouple_config('DJANGO_DATABASE_URL')
        decouple_config('MATHESAR_DATABASES')
    except UndefinedValueError as e:
        missing_config_key = e.args[0]
        raise Exception(f"{missing_config_key} environment variable is missing."
                        f" Please follow the documentation {documentation_link} to add the missing environment variable.")


def install_on_db_with_key(database_key, skip_confirm):
    install.install_mathesar(
        database_name=settings.DATABASES[database_key]["NAME"],
        username=settings.DATABASES[database_key]["USER"],
        password=settings.DATABASES[database_key]["PASSWORD"],
        hostname=settings.DATABASES[database_key]["HOST"],
        port=settings.DATABASES[database_key]["PORT"],
        skip_confirm=skip_confirm
    )


if __name__ == "__main__":
    main()
