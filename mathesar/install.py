"""
This script installs functions and types for Mathesar onto the configured DB.
"""
import getopt
import os
import sys

import django
from django.core import management
from decouple import config as decouple_config
from django.conf import settings
from db import install
from django.db.utils import IntegrityError
from db.credentials import DbCredentials


def main(skip_static_collection=False):
    # skip_confirm is temporarily enabled by default as we don't have any use
    # for interactive prompts with docker only deployments
    skip_confirm = True
    (opts, _) = getopt.getopt(sys.argv[1:], ":s", ["skip-confirm"])
    for (opt, value) in opts:
        if (opt == "-s") or (opt == "--skip-confirm"):
            skip_confirm = True
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
    django.setup()
    management.call_command('migrate')
    from mathesar.models.base import Database
    debug_mode = decouple_config('DEBUG', default=False, cast=bool)
    #
    if not debug_mode and not skip_static_collection:
        management.call_command('collectstatic', '--noinput', '--clear')
    print("------------Setting up User Databases------------")
    django_db_key = decouple_config('DJANGO_DATABASE_KEY', default="default")
    user_databases = [key for key in settings.DATABASES if key != django_db_key]
    for database_key in user_databases:
        credentials = _get_credentials_from_dj_settings(database_key)
        try:
            install_on_db_with_key(credentials, skip_confirm)
            Database.current_objects.create(
                name=database_key,
                db_name=credentials.db_name,
                username=credentials.username,
                password=credentials.password,
                host=credentials.hostname,
                port=credentials.port,
                editable=False
            ).save()
        except IntegrityError as e:
            if e.args[0].startswith(
                (
                    'duplicate key value violates unique constraint',
                    'UNIQUE constraint failed: mathesar_database.name'
                )
            ):
                db_model = Database.current_objects.get(name=database_key)
                db_model.db_name = credentials.db_name
                db_model.username = credentials.username
                db_model.password = credentials.password
                db_model.host = credentials.hostname
                db_model.port = credentials.port
                db_model.editable = False
                db_model.save()
            else:
                raise e


def install_on_db_with_key(credentials, skip_confirm):
    return install.install_mathesar(
        credentials,
        skip_confirm=skip_confirm
    )


def get_default_credentials_from_dj_settings():
    """
    Returns credentials for "default" Django db.

    The DATABASES construct inside Django settings must always have a database
    under the key "default". We use the credentials of this database as a
    reference when creating the credentials for another database on the same
    Postgres cluster (install). As of writing, we only do this in testing.
    Basically, this is a way to know what the username, password, hostname,
    etc. are for our development Postgres cluster.
    """
    return _get_credentials_from_dj_settings('default')


def _get_credentials_from_dj_settings(database_key):
    """
    Returns credentials for Django db under given key.

    Relevant django docs:
    https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-DATABASES
    """
    raw_credentials = settings.DATABASES[database_key]
    credentials = DbCredentials(
        username=raw_credentials["USER"],
        password=raw_credentials["PASSWORD"],
        hostname=raw_credentials["HOST"],
        db_name=raw_credentials["NAME"],
        port=raw_credentials["PORT"],
    )
    return credentials


if __name__ == "__main__":
    main()
