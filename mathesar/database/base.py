from django.conf import settings
from db import engine

default_user = settings.DATABASES["mathesar_tables"]["USER"]
default_password = settings.DATABASES["mathesar_tables"]["PASSWORD"]
default_host = settings.DATABASES["mathesar_tables"]["HOST"]
default_tables_db = settings.DATABASES["mathesar_tables"]["NAME"]
default_port = settings.DATABASES["mathesar_tables"]["PORT"]


def create_mathesar_engine(
        user=default_user,
        password=default_password,
        host=default_host,
        database=default_tables_db,
        port=default_port,
):
    return engine.create_future_engine_with_custom_types(
        user, password, host, database, port,
    )
