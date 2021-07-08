from django.conf import settings

from mathesar.models import Schema, Database
from db.engine import get_connection_string


def get_database_key(engine):
    databases = settings.DATABASES
    for database in databases:
        database_dict = databases[database]
        settings_conn_str = get_connection_string(
            database_dict['USER'],
            database_dict['PASSWORD'],
            database_dict['HOST'],
            database_dict['NAME'],
            database_dict['PORT']
        )
        if settings_conn_str == str(engine.url):
            return database
    return None


def get_non_default_database_keys():
    return [key for key in settings.DATABASES if key != 'default']


def update_databases():
    databases = set(settings.DATABASES)

    # Update deleted databases
    for database in Database.objects.all():
        if database.name in databases:
            databases.remove(database.name)
        else:
            database.deleted = True
            Schema.objects.filter(database=database).delete()
            database.save()

    # Create databases that aren't models yet
    for database in databases:
        Database.objects.create(name=database)
