from .base import * # noqa

from conftest import TEST_DB


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "##65wggf@zk(5ruq@p!6d20)#f&*jsissx--#8_ppocpv8(i1g"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = []

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
