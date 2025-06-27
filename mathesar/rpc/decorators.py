from modernrpc.core import rpc_method
from modernrpc import auth
from modernrpc.auth.basic import (
    http_basic_auth_check_user,
    http_basic_auth_login_required,
    http_basic_auth_superuser_required,
)
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.analytics import wire_analytics


def user_is_anon_or_authenticated(user):
    # No need to check auth.user_is_anonymous(user) or auth.user_is_authenticated(user) just return True.
    return True


# Decorator
def http_basic_auth_anonymous(func=None):
    """Decorator. Use it to specify a RPC method is available anonynous users"""
    wrapper = auth.set_authentication_predicate(http_basic_auth_check_user, [user_is_anon_or_authenticated])

    # If @http_basic_auth_anonymous() is used (with parenthesis)
    if func is None:
        return wrapper

    # If @http_basic_auth_anonymous is used without parenthesis
    return wrapper(func)


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
    if auth == "login":
        auth_wrap = http_basic_auth_login_required
    elif auth == "superuser":
        auth_wrap = http_basic_auth_superuser_required
    elif auth == "anonymous":
        auth_wrap = http_basic_auth_anonymous
    else:
        raise Exception("`auth` must be 'superuser', 'login' or 'anonymous'")

    def combo_decorator(f):
        return rpc_method(name=name)(auth_wrap(wire_analytics(handle_rpc_exceptions(f))))
    return combo_decorator
