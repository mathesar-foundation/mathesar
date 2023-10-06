from datetime import timedelta

from django.conf import settings
from django.core.management import BaseCommand
from django.utils.timezone import now
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db import engine
from db.metadata import get_empty_metadata
from mathesar.models.base import Database
from mathesar.state.django import reflect_db_objects


class Command(BaseCommand):
    help = 'Cleans up the stale database created during live demo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force delete a database even if it in use'
        )
        parser.add_argument(
            '--max-days',
            action='store',
            type=int,
            default=3,
            help='A database is considered for deletion if it has existed for more than --max-days',
        )

    def handle(self, *args, **options):
        drop_all_stale_databases(*args, **options)


def drop_all_stale_databases(force=False, max_days=3, *args, **kwargs):
    excluded_databases = [
        settings.DATABASES["default"]["NAME"],
        settings.DATABASES["mathesar_tables"]["NAME"],
        getattr(settings, "MATHESAR_DEMO_TEMPLATE", None),
        # Exclude Postgres default databases
        'postgres',
        'template0',
        'template1'
    ]
    stale_databases = Database.objects.filter(created_at__lt=now() - timedelta(days=max_days))
    deleted_databases = []
    root_db_credentials = DbCredentials(
        username=settings.DATABASES["default"]["USER"],
        password=settings.DATABASES["default"]["PASSWORD"],
        hostname=settings.DATABASES["default"]["HOST"],
        db_name=settings.DATABASES["default"]["NAME"]
        port=settings.DATABASES["default"]["PORT"],
    )
    for database in stale_databases:
        if database.name not in excluded_databases:
            # Difference between user db and root db is only the db_name
            user_db_credentials = root_db_credentials._replace(
                db_name=database.name,
            )
            dropped = drop_mathesar_database(
                user_db_credentials=user_db_credentials,
                root_db_credentials=root_db_credentials,
                force=force
            )
            if dropped:
                deleted_databases.append(database.name)
                database.delete()
                # TODO BUG reflect_db_objects should never be called directly,
                # it's public only because it's called by a higher-level module.
                reflect_db_objects(get_empty_metadata(), db_name=database.name)
    return deleted_databases


def drop_mathesar_database(
    user_db_credentials, root_db_credentials, force=False
):
    user_db_engine = engine.create_future_engine(user_db_credentials)
    try:
        user_db_engine.connect()
    except OperationalError:
        # Non existent db object
        user_db_engine.dispose()
        return True
    else:
        try:
            root_db_engine = engine.create_future_engine(
                root_db_credentials
            )
            with root_db_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                delete_stmt = f"""
                    DROP DATABASE {user_db_credentials.db_name}
                    {'WITH (FORCE)' if force else ''}
                """
                conn.execute(text(delete_stmt))
                # This database is not created using a config file,
                # so their objects can be safety deleted
                # as they won't be created again during reflection
                return True
        except OperationalError:
            # Database is in use, ignore
            pass
    return False
