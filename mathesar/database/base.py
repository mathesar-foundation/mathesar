from django.conf import settings
from sqlalchemy import MetaData, create_engine, inspect

from mathesar.settings import mathesar_settings

APP_PREFIX = mathesar_settings["APP_PREFIX"]
ID = f"{APP_PREFIX}id"


engine = create_engine(
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


def db_name(human_readable_name):
    return f"{APP_PREFIX}{human_readable_name}"


def human_readable_name(db_name):
    return db_name.replace(APP_PREFIX, "", 1)
