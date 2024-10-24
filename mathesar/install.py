"""
This script installs the Mathesar Django tables onto the configured DB server.
"""
import os

import django
from django.core import management


def main(skip_static_collection=False):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
    django.setup()
    management.call_command('migrate')
    debug_mode = bool(os.environ.get('DEBUG', default=False))
    #
    if not debug_mode and not skip_static_collection:
        management.call_command('collectstatic', '--noinput', '--clear')


if __name__ == "__main__":
    main()
