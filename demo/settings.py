from config.settings.common_settings import *  # noqa
from decouple import config as decouple_config

INSTALLED_APPS += [  # noqa
    "demo",
    "health_check",
]

MIDDLEWARE += [  # noqa
    "demo.middleware.LiveDemoModeMiddleware",
]


SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

MATHESAR_MODE = 'PRODUCTION'
MATHESAR_LIVE_DEMO = True
MATHESAR_LIVE_DEMO_USERNAME = decouple_config('MATHESAR_LIVE_DEMO_USERNAME', default=None)
MATHESAR_LIVE_DEMO_PASSWORD = decouple_config('MATHESAR_LIVE_DEMO_PASSWORD', default=None)

MATHESAR_DEMO_TEMPLATE = 'mathesar_demo_template'
MATHESAR_DEMO_ARXIV_LOG_PATH = decouple_config(
    'MATHESAR_DEMO_ARXIV_LOG_PATH',
    default='/var/lib/mathesar/demo/arxiv_db_schema_log'
)
BASE_TEMPLATE_ADDITIONAL_SCRIPT_TEMPLATES += ['demo/analytics.html'] # noqa
ROOT_URLCONF = "demo.urls"
