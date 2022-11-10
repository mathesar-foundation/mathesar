from config.settings import *  # noqa

MIDDLEWARE += [  # noqa
    "demo.middleware.LiveDemoModeMiddleware",
]

MATHESAR_LIVE_DEMO = True
