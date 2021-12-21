from collections import namedtuple
from contextlib import contextmanager

from rest_framework.exceptions import APIException


class InvalidTableError(Exception):
    pass


ExceptionTransformerDetail = namedtuple(
    'ExceptionTransformerDetail',
    [
        'status_code',
        'error_code',
        'parser',
        'message',
        'field_name',
        'details'
    ]
)


def default_exception_parser(exception, error_code, message=None, field_name=None, details=None):
    return APIException([{
        "message": str(exception) if message is None else message,
        "error_code": error_code,
        "field": field_name,
        "details": details
    }])


@contextmanager
def exception_transformer(mapping):
    """
    Context manager to capture any exception that is thrown and convert it into proper API exception

    """
    try:
        yield
    except tuple(mapping.keys()) as exc:
        exception_transformation_details = mapping[type(exc)]
        status_code, error_code, parser, message, field_name, details = exception_transformation_details
        if parser is None:
            exception = default_exception_parser(exc, error_code, message, field_name, details)
        else:
            exception = parser(exc, error_code, message, field_name, details)
        exception.status_code = status_code
        raise exception
    except Exception as exc:
        exception = default_exception_parser(exc, 5000)
        exception.status_code = 500
        raise exception
