from config.settings.common_settings import * # noqa

# Override default settings
DEBUG = False
MATHESAR_MODE = 'PRODUCTION'
# Use a local.py module for settings that shouldn't be version tracked

print(DATABASES['default'])
try:
    from .local import * # noqa 
except ImportError:
    pass
