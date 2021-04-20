from django.conf import settings

DEFAULTS = {}

mathesar_settings = DEFAULTS

try:
    local_settings = settings.MATHESAR
except AttributeError:
    local_settings = None

if local_settings:
    for setting in local_settings:
        mathesar_settings[setting] = local_settings[setting]
