from http.client import CannotSendRequest

from django.core.exceptions import FieldDoesNotExist
from psycopg.errors import BadCopyFileFormat
import pytest
from sqlalchemy.exc import IntegrityError

from db.functions.exceptions import UnknownDBFunctionID
from mathesar.utils.connections import BadInstallationTarget
import mathesar.rpc.exceptions.error_codes as err_codes


class NotARealError(Exception):
    """An error we won't recognize for testing."""
    pass


@pytest.mark.parametrize(
    "example_err,expect_code", [
        (AssertionError, -31000),
        (BadCopyFileFormat, -30000),
        (FieldDoesNotExist, -29000),
        (BadInstallationTarget, -28000),
        (UnknownDBFunctionID, -27000),
        (IntegrityError, -26000),
        (CannotSendRequest, -25000),
    ]
)
def test_get_error_code_unknown(monkeypatch, example_err, expect_code):
    """
    Test behavior when we don't recognize an error from a module.

    Fixtures:
       monkeypatch(pytest): Lets us modify the Exception module.
    """
    monkeypatch.setattr(NotARealError, '__module__', example_err.__module__)
    try:
        raise NotARealError('Message text')
    except Exception as e:
        actual_code = err_codes.get_error_code(e)

    assert actual_code == expect_code


@pytest.mark.parametrize(
    "error,expect_code", [
        (AssertionError, -31002),
        (BadCopyFileFormat, -30009),
        (FieldDoesNotExist, -29030),
        (BadInstallationTarget, -28002),
        (UnknownDBFunctionID, -27024),
        (CannotSendRequest, -25031),
    ]
)
def test_get_error_code(error, expect_code):
    try:
        raise error("Message text")
    except Exception as e:
        actual_code = err_codes.get_error_code(e)

    assert actual_code == expect_code


def test_get_error_code_sqlalchemy():
    """
    This is needed since most SQLAlchemy exceptions have extra required
    init parameters.
    """
    expect_code = -26014
    try:
        raise IntegrityError("message test", None, None)
    except Exception as e:
        actual_code = err_codes.get_error_code(e)

    assert actual_code == expect_code
