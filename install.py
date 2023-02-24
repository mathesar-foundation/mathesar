"""
This script installs functions and types for Mathesar onto the configured DB.
"""
import getopt
import sys

import django
from django.core import management
from decouple import config as decouple_config
from django.conf import settings
from db import install


def main():
    # skip_confirm is temporarily enabled by default as we don't have any use for interactive prompts with docker only deployments
    skip_confirm = True
    (opts, _) = getopt.getopt(sys.argv[1:], ":s", ["skip-confirm"])
    for (opt, value) in opts:
        if (opt == "-s") or (opt == "--skip-confirm"):
            skip_confirm = True
    django.setup()
    management.call_command('migrate')
    debug_mode = decouple_config('DEBUG', default=False, cast=bool)
    #
    if not debug_mode:
        management.call_command('collectstatic', '--noinput', '--clear')
    print("------------Setting up User Databases------------")
    user_databases = [key for key in settings.DATABASES if key != "default"]
    for database_key in user_databases:
        install_on_db_with_key(database_key, skip_confirm)


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
