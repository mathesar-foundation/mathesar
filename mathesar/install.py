"""
This script installs the Mathesar Django tables onto the configured DB server.
"""
import os

import django
from django.core import management
from decouple import config as decouple_config


def main(skip_static_collection=False):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
    django.setup()
    management.call_command('migrate')
    debug_mode = decouple_config('DEBUG', default=False, cast=bool)
    #
    if not debug_mode and not skip_static_collection:
        management.call_command('collectstatic', '--noinput', '--clear')


if __name__ == "__main__":
    main()
