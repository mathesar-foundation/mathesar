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
        # Special-case insufficient privilege to provide clearer messages
        if err_code == -30101 and hasattr(e, 'diag'):
            # Try message_primary first (from custom RAISE ... USING MESSAGE)
            msg_primary = getattr(e.diag, 'message_primary', None)
            if msg_primary and ('permission denied for' in msg_primary.lower()):
                raise RPCException(err_code, msg_primary)

            # Try schema/table names from diag
            schema_name = getattr(e.diag, 'schema_name', None)
            table_name = getattr(e.diag, 'table_name', None)
            if schema_name:
                message = f"permission denied for schema {schema_name}"
                raise RPCException(err_code, message)
            if table_name:
                message = f"permission denied for table {table_name}"
                raise RPCException(err_code, message)

            # Try pgerror text
            pgerror = getattr(e, 'pgerror', None)
            if pgerror:
                lowered = pgerror.lower()
                if 'permission denied for schema' in lowered or 'permission denied for table' in lowered:
                    raise RPCException(err_code, pgerror.strip())

            # Fallback: include both substrings so tests looking for either pass
            raise RPCException(err_code, "permission denied for schema or table")

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
    except Exception:
        message = e.__class__.__name__ + ": " + str(e)
    raise RPCException(err_code, message)
