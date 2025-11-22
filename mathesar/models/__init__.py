# We need to do this to register the model correctly in Django settings
from .users import User  # noqa
from .analytics import InstallationID, AnalyticsReport  # noqa
from .base import *  # noqa
