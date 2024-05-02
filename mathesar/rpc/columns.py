"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from db.columns.operations.select import get_column_info_for_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from mathesar.utils.columns import get_display_options

@rpc_method(name='columns.list')
@http_basic_auth_login_required
@handle_rpc_exceptions
def list(*, table_oid: int, database_id: int):
    """
    List columns for a table, with information about each.

    Also return display options for each column, if they're defined.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django model id of the database containing the table.

    Returns:
        A list of column details, and a separate list of display options.
    """
    with connect(database_id) as conn:
        column_info = get_column_info_for_table(table_oid, conn)
    attnums = [col['id'] for col in column_info]
    display_options = get_display_options(table_oid, attnums)
    return {
        "column_info": column_info,
        "display_options": display_options
    }
