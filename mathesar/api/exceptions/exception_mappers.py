
from psycopg2.errors import InvalidTextRepresentation, CheckViolation, UniqueViolation

from mathesar.api.exceptions import exceptions as api_exceptions


def integrity_error_mapper(exc):
    orig_type = type(exc.orig)
    if orig_type == CheckViolation:
        return api_exceptions.InvalidTypeCastAPIException(exc)
    elif orig_type == UniqueViolation:
        return api_exceptions.UniqueViolationAPIException(exc)
    else:
        return api_exceptions.IntegrityAPIException(exc)