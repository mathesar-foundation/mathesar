from .base import * # noqa

from conftest import TEST_DB


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

# TODO: Add to documentation that database keys should not be than 128 characters.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mathesar_django",
        "USER": "mathesar",
        "PASSWORD": "mathesar",
        "HOST": "db",
        "PORT": 5432,
    },
    TEST_DB: {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": TEST_DB,
        "USER": "mathesar",
        "PASSWORD": "mathesar",
        "HOST": "db",
        "PORT": 5432,
    }
}
