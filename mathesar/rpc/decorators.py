import datetime
from functools import wraps
import threading
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.cache import cache
from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import (
    http_basic_auth_login_required,
    http_basic_auth_superuser_required,
)
from mathesar.analytics import wire_analytics
from mathesar.models import base as models, exceptions
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.download_links import maintain_download_links

MAINTENANCE_DONE = "maintenance_done"
CACHE_TIMEOUT = 1800


def mathesar_rpc_method(*, name, auth="superuser"):
    """
    Construct a decorator to add RPC functionality to functions.

    Args:
        name: the name of the function that exposed at the RPC endpoint.
        auth: the authorization wrapper for the function.
            - "superuser" (default): only superusers can call it.
            - "login": any logged in user can call it.
            - "anonymous": any user can call it, no login required.
    """
    authorization_wrap = lambda x: x # noqa
    if auth == "login":
        auth_wrap = http_basic_auth_login_required
        authorization_wrap = ensure_db_authorization
    elif auth == "superuser":
        auth_wrap = http_basic_auth_superuser_required
    elif auth == "anonymous":
        auth_wrap = lambda x: x # noqa
    else:
        raise Exception("`auth` must be 'superuser', 'login' or 'anonymous'")

    def combo_decorator(f):
        return rpc_method(name=name)(
            auth_wrap(authorization_wrap(maintain_models(wire_analytics(handle_rpc_exceptions(f)))))
        )
    return combo_decorator


def maintain_models(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if settings.TEST is False and cache.add(MAINTENANCE_DONE, True, CACHE_TIMEOUT):
            threading.Thread(target=run_model_maintenance).start()
        return f(*args, **kwargs)
    return wrapped


def run_model_maintenance():
    Session.objects.filter(
        expire_date__lt=datetime.datetime.now(datetime.timezone.utc)
    ).delete()
    maintain_download_links()


def ensure_db_authorization(f):
    # This is needed for endpoints with "login" auth that don't call connect()
    @wraps(f)
    def wrapper(*args, **kwargs):
        DATABASE_ID_KEY = 'database_id'
        if DATABASE_ID_KEY in kwargs.keys():
            user = kwargs.get(REQUEST_KEY).user
            database_id = kwargs[DATABASE_ID_KEY]
            try:
                models.UserDatabaseRoleMap.objects.get(database__id=database_id, user=user)
            except models.UserDatabaseRoleMap.DoesNotExist as e:
                raise exceptions.NoConnectionAvailable(e)
        return f(*args, **kwargs)
    return wrapper
