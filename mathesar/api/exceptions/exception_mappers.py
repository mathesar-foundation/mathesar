from psycopg2.errors import CheckViolation, UniqueViolation

from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions,
    base_exceptions as base_database_api_exceptions,
)


def integrity_error_mapper(exc):
    orig_type = type(exc.orig) if hasattr(exc, 'orig') else None
    if orig_type == CheckViolation:
        return database_api_exceptions.InvalidTypeCastAPIException(exc)
    elif orig_type == UniqueViolation:
        return database_api_exceptions.UniqueViolationAPIException(exc)
    else:
        return base_database_api_exceptions.IntegrityAPIException(exc)
