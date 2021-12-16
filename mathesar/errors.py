from contextlib import contextmanager

from rest_framework import exceptions
from rest_framework.exceptions import APIException, ValidationError


class InvalidTableError(Exception):
    pass

def default_exception_parser(exception):
    return ValidationError(exception)

@contextmanager
def exception_transformer(mapping):
    """
    This context manager captures any exception that is thrown and converts it into proper API exception

    """
    try:
        yield
    except tuple(mapping.keys()) as exc:
        exc = default_exception_parser(exc)
        exc.status_code = 400

        raise exc
