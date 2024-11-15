from functools import wraps

from modernrpc.exceptions import AuthenticationFailed


def http_basic_auth_is_self_or_superuser(func):
    """Decorator. Use it to specify a RPC method is available only to self and superuser"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        user = kwargs['request'].user
        user_id = kwargs['user_id']
        if not (user.id == user_id or user.is_superuser or user.is_authenticated):
            raise AuthenticationFailed(func.__name__)
        return func(*args, **kwargs)
    return wrapper


def http_basic_auth_is_self(func):
    """Decorator. Use it to specify a RPC method is available only to self"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        user = kwargs['request'].user
        user_id = kwargs['user_id']
        if not (user.id == user_id or user.is_authenticated):
            raise AuthenticationFailed(func.__name__)
        return func(*args, **kwargs)
    return wrapper
