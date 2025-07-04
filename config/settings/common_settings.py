"""
Base settings to build other settings files upon.

Generated by 'django-admin startproject' using Django 3.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""

import os
from pathlib import Path

from config.database_config import PostgresConfig, parse_port


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "django_property_filter",
    "modernrpc",
    "mathesar",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "mathesar.middleware.CursorClosedHandlerMiddleware",
    "mathesar.middleware.PasswordChangeNeededMiddleware",
]

ROOT_URLCONF = "config.urls"

MODERNRPC_METHODS_MODULES = [
    'mathesar.rpc.analytics',
    'mathesar.rpc.collaborators',
    'mathesar.rpc.columns',
    'mathesar.rpc.columns.metadata',
    'mathesar.rpc.constraints',
    'mathesar.rpc.data_modeling',
    'mathesar.rpc.databases',
    'mathesar.rpc.databases.configured',
    'mathesar.rpc.databases.privileges',
    'mathesar.rpc.databases.setup',
    'mathesar.rpc.explorations',
    'mathesar.rpc.forms',
    'mathesar.rpc.records',
    'mathesar.rpc.roles',
    'mathesar.rpc.roles.configured',
    'mathesar.rpc.schemas',
    'mathesar.rpc.schemas.privileges',
    'mathesar.rpc.servers.configured',
    'mathesar.rpc.tables',
    'mathesar.rpc.tables.metadata',
    'mathesar.rpc.tables.privileges',
    'mathesar.rpc.users'
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "config.context_processors.frontend_settings",
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "mathesar.template_context_processors.base_template_extensions.script_extension_templates"
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

# TODO: Add to documentation that database keys should not be than 128 characters.

DATABASES = {}
POSTGRES_DB = os.environ.get('POSTGRES_DB', default=None)
POSTGRES_USER = os.environ.get('POSTGRES_USER', default=None)
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', default=None)
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', default=None)
POSTGRES_PORT = os.environ.get('POSTGRES_PORT', default=None)

# POSTGRES_DB, POSTGRES_USER, and POSTGRES_HOST are required env variables for forming a pg connection string for the django database
if POSTGRES_DB and POSTGRES_USER and POSTGRES_HOST:
    DATABASES['default'] = PostgresConfig(
        dbname=POSTGRES_DB,
        host=POSTGRES_HOST,
        port=parse_port(POSTGRES_PORT),
        role=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    ).to_django_dict()
    DATABASES['default']['OPTIONS'] = {
        "application_name": "Mathesar Django"
    }

for db_key, db_dict in DATABASES.items():
    # Engine should be '.postgresql' or '.postgresql_psycopg2' for all db(s)
    if not db_dict['ENGINE'].startswith('django.db.backends.postgresql'):
        raise ValueError(
            f"{db_key} is not a PostgreSQL database. "
            f"{db_dict['ENGINE']} found for {db_key}'s engine."
        )

# TODO: We use this variable for analytics, consider removing/renaming it.
TEST = bool(os.environ.get('TEST', default=False))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', default="2gr6ud88x=(p855_5nbj_+7^gw-iz&n7ldqv%94mjaecl+b9=4")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG') in ['t', 'true', 'True']

ALLOWED_HOSTS = [i.strip() for i in os.environ.get('ALLOWED_HOSTS', default=".localhost, 127.0.0.1, [::1]").split(',')]

# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/
# https://docs.djangoproject.com/en/3.1/ref/contrib/staticfiles/

STATIC_URL = "/static/"

# When running with DEBUG=False, the webserver needs to serve files from this location
# python manage.py collectstatic has to be run to collect all static files into this location
# The files need to served in brotli or gzip compressed format
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')

# Media files (uploaded by the user)
DEFAULT_MEDIA_ROOT = os.path.join(BASE_DIR, '.media/')
MEDIA_ROOT = os.environ.get('MEDIA_ROOT', default=DEFAULT_MEDIA_ROOT)

MEDIA_URL = "/media/"

# Update Authentication classes, removed BasicAuthentication
# Defaults: https://www.django-rest-framework.org/api-guide/settings/
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication'
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ),
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
    'EXCEPTION_HANDLER':
        'mathesar.exception_handlers.mathesar_exception_handler',
}

# Mathesar settings
MATHESAR_MODE = os.environ.get('MODE', default='PRODUCTION')
MATHESAR_UI_BUILD_LOCATION = os.path.join(BASE_DIR, 'mathesar/static/mathesar/')
MATHESAR_MANIFEST_LOCATION = os.path.join(MATHESAR_UI_BUILD_LOCATION, 'manifest.json')
MATHESAR_CLIENT_DEV_URL = os.environ.get(
    'MATHESAR_CLIENT_DEV_URL',
    default='http://localhost:3000'
)
MATHESAR_UI_SOURCE_LOCATION = os.path.join(BASE_DIR, 'mathesar_ui/')
MATHESAR_CAPTURE_UNHANDLED_EXCEPTION = os.environ.get('CAPTURE_UNHANDLED_EXCEPTION', default=False)
MATHESAR_STATIC_NON_CODE_FILES_LOCATION = os.path.join(BASE_DIR, 'mathesar/static/non-code/')
MATHESAR_ANALYTICS_URL = os.environ.get('MATHESAR_ANALYTICS_URL', default='https://example.com/collector')
MATHESAR_INIT_REPORT_URL = os.environ.get('MATHESAR_INIT_REPORT_URL', default='https://example.com/hello')
MATHESAR_FEEDBACK_URL = os.environ.get('MATHESAR_FEEDBACK_URL', default='https://example.com/feedback')

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# UI source files have to be served by Django in order for static assets to be included during dev mode
# https://vitejs.dev/guide/assets.html
# https://vitejs.dev/guide/backend-integration.html
STATICFILES_DIRS = [MATHESAR_UI_SOURCE_LOCATION, MATHESAR_STATIC_NON_CODE_FILES_LOCATION] if MATHESAR_MODE == 'DEVELOPMENT' else [MATHESAR_UI_BUILD_LOCATION, MATHESAR_STATIC_NON_CODE_FILES_LOCATION]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Accounts
AUTH_USER_MODEL = 'mathesar.User'
LOGIN_URL = '/auth/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = LOGIN_URL
DRF_ACCESS_POLICY = {
    'reusable_conditions': ['mathesar.api.permission_conditions']
}
# List of Template names that contains additional script tags to be added to the base template
BASE_TEMPLATE_ADDITIONAL_SCRIPT_TEMPLATES = []

# i18n
LANGUAGES = [
    ('en', 'English'),
    ('ja', 'Japanese'),
]
LOCALE_PATHS = [
    'translations'
]
LANGUAGE_COOKIE_NAME = 'display_language'
FALLBACK_LANGUAGE = 'en'

SALT_KEY = SECRET_KEY
