from django.conf import settings
from sqlalchemy import MetaData, create_engine, inspect

from mathesar.settings import mathesar_settings
from mathesar.database.types import types

APP_PREFIX = mathesar_settings["APP_PREFIX"]
ID = f"{APP_PREFIX}id"


def create_engine_with_custom_types(*args, **kwargs):
    engine = create_engine(*args, **kwargs)
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
    return engine


engine = create_engine_with_custom_types(
    "postgresql://{username}:{password}@{hostname}/{database}".format(
        username=settings.DATABASES["default"]["USER"],
        password=settings.DATABASES["default"]["PASSWORD"],
        hostname=settings.DATABASES["default"]["HOST"],
        database=settings.DATABASES["default"]["NAME"],
    ),
    future=True,
)
metadata = MetaData(bind=engine)
inspector = inspect(engine)
