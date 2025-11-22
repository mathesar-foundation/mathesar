"""
This script installs the Mathesar Django tables onto the configured DB server.
"""
import os

import django
from django.core import management


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
    django.setup()
    management.call_command('migrate')
    skip_static_collection = os.environ.get('SKIP_STATIC_COLLECTION') in ['t', 'true', 'True']
    if not skip_static_collection:
        management.call_command('collectstatic', '--noinput', '--clear')


if __name__ == "__main__":
    main()
