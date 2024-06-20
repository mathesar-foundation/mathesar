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
from django.db.utils import IntegrityError
from sqlalchemy.exc import OperationalError
from db import install


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
    debug_mode = decouple_config('DEBUG', default=False, cast=bool)
    #
    if not debug_mode and not skip_static_collection:
        management.call_command('collectstatic', '--noinput', '--clear')
    print("------------Setting up User Databases------------")
    django_db_key = decouple_config('DJANGO_DATABASE_KEY', default="default")
    user_databases = [key for key in settings.DATABASES if key != django_db_key]
    for database_key in user_databases:
        try:
            install_on_db_with_key(database_key, skip_confirm)
        except IntegrityError:
            continue


def install_on_db_with_key(database_key, skip_confirm):
    from mathesar.models.deprecated import Connection
    db_model = Connection.create_from_settings_key(database_key)
    db_model.save()
    try:
        install.install_mathesar(
            database_name=db_model.db_name,
            hostname=db_model.host,
            username=db_model.username,
            password=db_model.password,
            port=db_model.port,
            skip_confirm=skip_confirm
        )
    except OperationalError as e:
        db_model.delete()
        raise e


if __name__ == "__main__":
    main()
