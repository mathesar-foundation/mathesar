from config.settings.production import *  # noqa

MIDDLEWARE += [  # noqa
    "demo.middleware.LiveDemoModeMiddleware",
]

MATHESAR_LIVE_DEMO = True
