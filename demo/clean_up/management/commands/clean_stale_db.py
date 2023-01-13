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
        'mathesar',
        # Exclude Postgres default databases
        'postgres',
        'template0',
        'template1'
    ]
    stale_databases = Database.objects.filter(created_at__lt=now() - timedelta(minutes=max_days))
    deleted_databases = []
    for database in stale_databases:
        if database.name not in excluded_databases and database.deleted is False:
            dropped = drop_mathesar_database(
                database.name,
                username=settings.DATABASES["default"]["USER"],
                password=settings.DATABASES["default"]["PASSWORD"],
                hostname=settings.DATABASES["default"]["HOST"],
                root_database=settings.DATABASES["default"]["NAME"],
                port=settings.DATABASES["default"]["PORT"],
                force=force
            )
            if dropped:
                deleted_databases.append(database.name)
                database.delete()
    reflect_db_objects(get_empty_metadata())
    return deleted_databases


def drop_mathesar_database(
        user_database, username, password, hostname, root_database, port, force=False
):
    user_db_engine = engine.create_future_engine(
        username, password, hostname, user_database, port
    )
    try:
        user_db_engine.connect()
    except OperationalError:
        # Non existent db object
        user_db_engine.dispose()
        return True
    else:
        try:
            root_db_engine = engine.create_future_engine(
                username, password, hostname, root_database, port,
            )
            with root_db_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                delete_stmt = f"DROP DATABASE {user_database} {'WITH (FORCE)' if force else ''}"
                conn.execute(text(delete_stmt))
                # This database is not created using a config file,
                # so their objects can be safety deleted
                # as they won't be created again during reflection
                return True
        except OperationalError:
            # Database is in use, ignore
            pass
    return False
