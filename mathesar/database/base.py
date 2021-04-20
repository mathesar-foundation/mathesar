from django.conf import settings
from sqlalchemy import create_engine

from mathesar.settings import mathesar_settings
from mathesar.database import types

APP_PREFIX = mathesar_settings["APP_PREFIX"]
ID = f"{APP_PREFIX}id"


def create_engine_with_custom_types(
        username, password, hostname, database, *args, **kwargs
):
    conn_str = f"postgresql://{username}:{password}@{hostname}/{database}"
    engine = create_engine(conn_str, *args, **kwargs)
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
    return engine


def create_mathesar_engine():
    return create_engine_with_custom_types(
        settings.DATABASES["default"]["USER"],
        settings.DATABASES["default"]["PASSWORD"],
        settings.DATABASES["default"]["HOST"],
        settings.DATABASES["default"]["NAME"],
        future=True,
    )
