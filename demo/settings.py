from config.settings import *  # noqa
from decouple import config as decouple_config


MIDDLEWARE += [  # noqa
    "demo.middleware.LiveDemoModeMiddleware",
]

ROOT_URLCONF = "demo.urls"

MATHESAR_LIVE_DEMO = True
MATHESAR_LIVE_DEMO_USERNAME = decouple_config('MATHESAR_LIVE_DEMO_USERNAME', default=None)
MATHESAR_LIVE_DEMO_PASSWORD = decouple_config('MATHESAR_LIVE_DEMO_PASSWORD', default=None)
