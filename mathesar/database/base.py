from django.conf import settings
from db import engine
from mathesar.database import utils

MATHESAR_KEYS = utils.get_non_default_database_keys()


def create_mathesar_engine(mathesar_tables_key=MATHESAR_KEYS[0]):
    return engine.create_future_engine_with_custom_types(
        settings.DATABASES[mathesar_tables_key]["USER"],
        settings.DATABASES[mathesar_tables_key]["PASSWORD"],
        settings.DATABASES[mathesar_tables_key]["HOST"],
        settings.DATABASES[mathesar_tables_key]["NAME"],
        settings.DATABASES[mathesar_tables_key]["PORT"],
    )
