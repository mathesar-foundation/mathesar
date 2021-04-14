from django.conf import settings
from sqlalchemy import MetaData, create_engine, inspect

from mathesar.settings import mathesar_settings
from mathesar.database import types

APP_PREFIX = mathesar_settings["APP_PREFIX"]
ID = f"{APP_PREFIX}id"


def create_engine_with_custom_types(*args, **kwargs):
    engine = create_engine(*args, **kwargs)
    # We need to add our custom types to any engine created for SQLALchemy use
    # so that they can be used for reflection
    engine.dialect.ischema_names.update(types.CUSTOM_TYPE_DICT)
    return engine


def create_mathesar_engine():
    return create_engine_with_custom_types(
        "postgresql://{username}:{password}@{hostname}/{database}".format(
            username=settings.DATABASES["default"]["USER"],
            password=settings.DATABASES["default"]["PASSWORD"],
            hostname=settings.DATABASES["default"]["HOST"],
            database=settings.DATABASES["default"]["NAME"],
        ),
        future=True,
    )

engine = create_mathesar_engine()
metadata = MetaData(bind=engine)
inspector = inspect(engine)
