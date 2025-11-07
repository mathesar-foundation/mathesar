"""Custom Exceptions to improve debugging in RPC endpoint"""
from functools import wraps

from modernrpc.exceptions import RPCException

from mathesar.rpc.exceptions import error_codes


def handle_rpc_exceptions(f):
    """Wrap a function to process any Exception raised."""
    f.rpc_exceptions_handled = True

    @wraps(f)
    def safe_func(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            _raise_generic_error(e)
    return safe_func


def _raise_generic_error(e):
    """Raises a fixed code and message for an error."""
    err_code = error_codes.get_error_code(e)
    try:
        diag_dict = {
            e.__class__.__name__: e.diag.message_primary or "",
            "Detail": e.diag.message_detail,
            "Hint": e.diag.message_hint,
            "Constraint": e.diag.constraint_name,
            "Column": e.diag.column_name,
            "Table": e.diag.table_name,
            "Schema": e.diag.schema_name,
            "Datatype": e.diag.datatype_name,
            "SQLSTATE": e.diag.sqlstate,
        }
        message = ' \n'.join(
            [
                ': '.join([k, v]) for k, v in diag_dict.items() if v is not None
            ]
        )
    except:
        message = e.__class__.__name__ + ": " + str(e)
    raise RPCException(err_code, message)
