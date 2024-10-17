import pytest

from modernrpc.exceptions import RPCException
from psycopg.errors import BadCopyFileFormat
from django.core.exceptions import FieldDoesNotExist
from mathesar.utils.permissions import BadInstallationTarget
from db.functions.exceptions import UnknownDBFunctionID
from http.client import CannotSendRequest

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


@handle_rpc_exceptions
def fake_func(exception):
    raise exception


@pytest.mark.parametrize(
    "example_err,expect_code", [
        (AssertionError, -31002),
        (BadCopyFileFormat, -30009),
        (FieldDoesNotExist, -29030),
        (BadInstallationTarget, -28002),
        (UnknownDBFunctionID, -27024),
        (CannotSendRequest, -25031),
    ]
)
def test_handle_rpc_exceptions(example_err, expect_code):
    """
    Tests whether a function wrapped by `handle_rpc_exceptions` always raises a `RPCException`
    for any given exception raised inside the function.
    """
    with pytest.raises(RPCException) as rpc_exception:
        fake_func(example_err)
    assert hasattr(fake_func, '__wrapped__')
    assert example_err.__name__ in rpc_exception.value.args[0]
    assert str(expect_code) in rpc_exception.value.args[0]
