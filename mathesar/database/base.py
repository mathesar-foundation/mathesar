import json
import time
import uuid

from django.conf import settings
from sqlalchemy import MetaData, create_engine

from mathesar.settings import mathesar_settings

APP_PREFIX = mathesar_settings["APP_PREFIX"]
ID = f"{APP_PREFIX}id"
CREATED = f"{APP_PREFIX}created"
MODIFIED = f"{APP_PREFIX}last_modified"
UUID = f"{APP_PREFIX}uuid"


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


class DBObject(object):
    @property
    def db_name(self):
        if not self.name:
            raise ValueError("Please set a name for this object.")
        return f"{APP_PREFIX}{self.name}"

    def get_comment(self, original_comment={}, overwrite_original=False):
        if overwrite_original:
            comment = original_comment | {
                UUID: uuid.uuid4(),
                CREATED: int(time.time()),
                MODIFIED: int(time.time()),
            }
        else:
            comment = {
                UUID: str(uuid.uuid4()),
                CREATED: int(time.time()),
                MODIFIED: int(time.time()),
            } | original_comment

        return json.dumps(comment, ensure_ascii=False)
