from collections import namedtuple
from contextlib import contextmanager

from rest_framework.exceptions import APIException, ValidationError
from psycopg2 import errors as pg_errors

class InvalidTableError(Exception):
    pass


ExceptionTransformerDetail = namedtuple('ExceptionTransformerDetail',
                                        [
                                         'status_code',
                                         'error_code',
                                         'parser',
                                         'message',
                                         'field_name',
                                         'details']
                                        )



def default_exception_parser(exception, error_code, message=None, field_name=None, details=None):
    return APIException([{
        "message": str(exception) if message is None else message ,
        "error_code": error_code,
        "field": field_name,
        "details": details
    }])

def integrity_exception_parser(exception, error_code, message=None, field_name=None, details=None):

    if isinstance(exception.orig, pg_errors.NotNullViolation):
        message_str, row_detail  = exception.orig.args[0].split("DETAIL")
        return APIException([{
            "message": message_str,
            "error_code": error_code,
            "field": field_name,
            "details": {'row_parameters': exception.params, 'row_detail': row_detail}
        }])
    return APIException([{
        "message": str(exception) if message is None else message ,
        "error_code": error_code,
        "field": field_name,
        "details": details
    }])


@contextmanager
def exception_transformer(mapping):
    """
    This context manager captures any exception that is thrown and converts it into proper API exception

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
