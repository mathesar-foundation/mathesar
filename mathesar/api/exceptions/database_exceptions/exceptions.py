from rest_framework import status

from db.columns.operations.select import get_column_attnum_from_name
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid
from mathesar.api.exceptions.database_exceptions.base_exceptions import ProgrammingAPIException
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.generic_exceptions.base_exceptions import (
    MathesarAPIException,
    get_default_exception_detail,
)
from mathesar.models.base import Column, Constraint
from mathesar.state import get_cached_metadata


class UniqueViolationAPIException(MathesarAPIException):
    """
    Exception raised when trying to:

    - Add unique constraint to column with non-unique values, or
    - trying to add non-unique value to a column with unique constraint, or
    """
    error_code = ErrorCodes.UniqueViolation.value

    def __init__(
            self,
            exception,
            message="This column has non-unique values so a unique constraint cannot be set",
            field=None,
            details=None,
            table=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        if details is None and table is not None:
            details = {}
            try:
                constraint_oid = get_constraint_oid_by_name_and_table_oid(
                    exception.orig.diag.constraint_name,
                    table.oid,
                    table._sa_engine
                )
                constraint = Constraint.objects.get(oid=constraint_oid)
                details = {
                    "constraint": constraint.id,
                    "constraint_columns": [c.id for c in constraint.columns],
                }
            except TypeError:
                details = {
                    "constraint": None,
                }
            details.update(
                {
                    "original_details": exception.orig.diag.message_detail,
                }
            )

        exception_detail = get_default_exception_detail(
            exception, self.error_code, message, field, details
        )._asdict()
        self.detail = [exception_detail]
        self.status_code = status_code


class DuplicateTableAPIException(ProgrammingAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.DuplicateTableError.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class DuplicateColumnAPIException(ProgrammingAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.DuplicateColumnError.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidDefaultAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.InvalidDefault.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidTypeOptionAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.InvalidTypeOption.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidTypeCastAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.InvalidTypeCast.value

    def __init__(
            self,
            exception,
            message="Invalid type cast requested.",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class DynamicDefaultAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UndefinedFunction.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class UnsupportedTypeAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UnsupportedType.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class BadFilterAPIException(MathesarAPIException):
    error_code = ErrorCodes.UnsupportedType.value

    def __init__(
            self,
            exception,
            message="Filter arguments are not correct",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class BadSortAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UnsupportedType.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class BadGroupAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UnsupportedType.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class RaiseExceptionAPIException(MathesarAPIException):
    """
    Exception raised inside a postgres function
    """
    error_code = ErrorCodes.RaiseException.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class UndefinedFunctionAPIException(MathesarAPIException):
    # Default message is not needed as the exception string provides enough details
    error_code = ErrorCodes.UndefinedFunction.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class NotNullViolationAPIException(MathesarAPIException):
    """
    Exception raised when trying to:

    - Add not null constraint to column with null value
    or when trying to add non-null value to a column with not null constraint

    or

    - Import/insert a null value to a column with not null constraint
    """
    error_code = ErrorCodes.NotNullViolation.value

    def __init__(
            self, exception,
            message=None,
            field=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            table=None
    ):
        exception_diagnostics = exception.orig.diag
        message_str = message if message is not None else exception_diagnostics.message_primary
        column_attnum = get_column_attnum_from_name(
            table.oid,
            exception.orig.diag.column_name,
            table.schema._sa_engine,
            metadata=get_cached_metadata(),
        )
        column = Column.objects.get(attnum=column_attnum, table=table)
        details = {
            'record_detail': exception_diagnostics.message_detail,
            'column_id': column.id
        }
        super().__init__(exception, self.error_code, message_str, field, details, status_code)


class TypeMismatchViolationAPIException(MathesarAPIException):
    """ Exception raised when trying to insert a non castable datatype value to a column with certain datatype"""
    error_code = ErrorCodes.TypeMismatchViolation.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class ForeignKeyViolationAPIException(MathesarAPIException):
    """ Exception raised when trying to add an invalid reference to a primary key """
    error_code = ErrorCodes.ForeignKeyViolation.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class UniqueImportViolationAPIException(MathesarAPIException):
    """ Exception raised when trying to add duplicate values to a column with uniqueness constraint """
    error_code = ErrorCodes.UniqueImportViolation.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_400_BAD_REQUEST
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class ExclusionViolationAPIException(MathesarAPIException):
    error_code = ErrorCodes.ExclusionViolation.value

    def __init__(
            self,
            exception,
            message=None,
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidDateAPIException(MathesarAPIException):
    error_code = ErrorCodes.InvalidDateError.value

    def __init__(
            self,
            exception,
            message="Invalid date",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class InvalidDateFormatAPIException(MathesarAPIException):
    error_code = ErrorCodes.InvalidDateFormatError.value

    def __init__(
            self,
            exception,
            message="Invalid date format",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)


class ColumnMappingsNotFound(MathesarAPIException):
    error_code = ErrorCodes.MappingsNotFound.value

    def __init__(
            self,
            exception,
            message="Valid column mappings not found",
            field=None,
            details=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        super().__init__(exception, self.error_code, message, field, details, status_code)
