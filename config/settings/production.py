from config.settings.common_settings import * # noqa

# Override default settings
DEBUG = False
MATHESAR_MODE = 'PRODUCTION'
MATHESAR_ANALYTICS_URL = 'https://analytics.mathesar.dev/collect-analytics-reports'
MATHESAR_INIT_REPORT_URL = 'https://analytics.mathesar.dev/collect-initial-report'

'''
This tells Django to trust the X-Forwarded-Proto header that comes from our proxy,
and any time its value is 'https', then the request is guaranteed to be secure
(i.e., it originally came in via HTTPS).
'''
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Use a local.py module for settings that shouldn't be version tracked
try:
    from .local import * # noqa 
except ImportError:
    pass
