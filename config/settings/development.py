from .base import * # noqa


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "2gr6ud88x=(p855_5nbj_+7^bw-iz&n7ldqv%94mjaecl+b9=4"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

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
