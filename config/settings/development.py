from .base import * # noqa


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
    "mathesar_tables": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mathesar",
        "USER": "mathesar",
        "PASSWORD": "mathesar",
        "HOST": "db",
        "PORT": 5432,
    }
}
