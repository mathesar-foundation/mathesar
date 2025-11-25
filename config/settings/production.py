from config.settings.common_settings import * # noqa

# Override default settings
MATHESAR_MODE = 'PRODUCTION'
MATHESAR_ANALYTICS_URL = 'https://analytics.mathesar.dev/collect-analytics-reports'
MATHESAR_INIT_REPORT_URL = 'https://analytics.mathesar.dev/collect-initial-report'
MATHESAR_FEEDBACK_URL = 'https://analytics.mathesar.dev/collect-feedback-message'

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
# config/settings/production.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # or 'django.db.backends.mysql' if using MySQL
        'NAME': 'your_db_name',                      # database name
        'USER': 'your_db_user',                      # database username
        'PASSWORD': 'your_db_password',              # database password
        'HOST': 'localhost',                         # or your DB host
        'PORT': '5432',                              # default PostgreSQL port, change if needed
    }
}
try:
    from .local import *
except ImportError:
    pass
