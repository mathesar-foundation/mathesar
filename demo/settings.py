from config.settings import *  # noqa

MIDDLEWARE += [  # noqa
    "demo.middleware.LiveDemoModeMiddleware",
]
