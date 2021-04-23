from django.conf import settings

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
