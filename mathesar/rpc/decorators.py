from functools import wraps
from modernrpc.core import rpc_method
from modernrpc.auth.basic import (
    http_basic_auth_login_required,
    http_basic_auth_superuser_required,
)
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


def mathesar_rpc_method(*, name, auth="superuser"):
    """
    Construct a decorator to add RPC functionality to functions.

    Args:
        name: the name of the function that exposed at the RPC endpoint.
        auth: the authorization wrapper for the function.
            - "superuser" (default): only superusers can call it.
            - "login": any logged in user can call it.
    """
    if auth == "login":
        auth_wrap = http_basic_auth_login_required
    elif auth == "superuser":
        auth_wrap = http_basic_auth_superuser_required
    else:
        raise Exception("`auth` must be 'superuser' or 'login'")
    def combo_decorator(f):
        return rpc_method(name=name)(auth_wrap(handle_rpc_exceptions(f)))
    return combo_decorator
