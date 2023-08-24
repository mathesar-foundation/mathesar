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


def main():
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
    if not debug_mode:
        management.call_command('collectstatic', '--noinput', '--clear')
    print("------------Setting up User Databases------------")
    django_db_key = decouple_config('DJANGO_DATABASE_KEY', default="default")
    user_databases = [key for key in settings.DATABASES if key != django_db_key]
    for database_key in user_databases:
        credentials = settings.DATABASES[database_key]
        try:
            install_on_db_with_key(credentials, skip_confirm)
            Database.objects.create(
                db_name=credentials["NAME"],
                db_username=credentials["USER"],
                db_password=credentials["PASSWORD"],
                db_host=credentials["HOST"],
                db_port=credentials["PORT"],
                editable=False
            ).save()
        except IntegrityError as e:
            if not e.args[0].startswith('duplicate key value violates unique constraint'):
                raise e


def install_on_db_with_key(credentials, skip_confirm):
    return install.install_mathesar(
        db_name=credentials["NAME"],
        db_username=credentials["USER"],
        db_password=credentials["PASSWORD"],
        db_host=credentials["HOST"],
        db_port=credentials["PORT"],
        skip_confirm=skip_confirm
    )


if __name__ == "__main__":
    main()
