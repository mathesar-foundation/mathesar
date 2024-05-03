"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.columns.operations.select import get_column_info_for_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from mathesar.utils.columns import get_display_options


class ColumnInfo(TypedDict):
    """
    Information about a column.

    Attributes:
        id (int): The `attnum` of the column in the table.
        name (str): The name of the column.
        type (str): The type of the column on the database.
        type_options (dict): The options applied to the column type.
        nullable (bool): Whether or not the column is nullable.
        primary_key (bool): Whether the column is in the primary key.
        default (dict): The default value and whether it's dynamic.
        has_dependents (bool): Whether the column has dependent objects.
        description (str): The description of the column.
    """

    @classmethod
    def from_column_info_json(cls, col_info):
        return cls(**col_info)


@rpc_method(name='columns.list')
@http_basic_auth_login_required
@handle_rpc_exceptions
def list(*, table_oid: int, database_id: int, **kwargs):
    """
    List columns for a table, with information about each.

    Also return display options for each column, if they're defined.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django model id of the database containing the table.

    Returns:
        A list of column details, and a separate list of display options.
    """
    # TODO Add user as arg for connect and get_display_options
    request = kwargs.get(REQUEST_KEY)
    with connect(database_id, request.user) as conn:
        column_info = [
            ColumnInfo.from_column_info_json(col)
            for col in get_column_info_for_table(table_oid, conn)
        ]
    if request.user.metadata_privileges(database_id) is not None:
        attnums = [col['id'] for col in column_info]
        display_options = get_display_options(table_oid, attnums)
    else:
        display_options = None
    return {
        "column_info": column_info,
        "display_options": display_options
    }
