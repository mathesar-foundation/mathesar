from config.settings.common_settings import * # noqa

# Override default settings
DEBUG = False
MATHESAR_MODE = 'PRODUCTION'
POSTGRES_DB = decouple_config('POSTGRES_DB')
POSTGRES_USER = decouple_config('POSTGRES_USER')
POSTGRES_PASSWORD = decouple_config('POSTGRES_PASSWORD')

if POSTGRES_DB and POSTGRES_USER and POSTGRES_PASSWORD:
    DATABASES['default'] = db_url(f'postgres://{POSTGRES_USER}:{POSTGRES_PASSWORD}@mathesar_db:5432/{POSTGRES_DB}')
else:
    DATABASES['default'] = db_url('sqlite:///db.sqlite3')
# Use a local.py module for settings that shouldn't be version tracked

print(DATABASES['default'])
try:
    from .local import * # noqa 
except ImportError:
    pass
