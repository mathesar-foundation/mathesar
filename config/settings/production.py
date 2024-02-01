from config.settings.common_settings import * # noqa

# Override default settings
DEBUG = False
MATHESAR_MODE = 'PRODUCTION'
# Use a local.py module for settings that shouldn't be version tracked
try:
    from .local import * # noqa 
except ImportError:
    pass
