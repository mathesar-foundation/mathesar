"""
Classes and functions exposed to the RPC endpoint for managing data models.
"""
from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.links.operations import create as links_create
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


@rpc_method(name="data_modeling.add_foreign_key_column")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add_foreign_key_column(
        *,
        column_name: str,
        referrer_table_oid: int,
        referent_table_oid: int,
        database_id: int,
        **kwargs
) -> None:
    """
    Add a foreign key column to a table.

    The foreign key column will be newly created, and will reference the
    `id` column of the referent table.

    Args:
        column_name: The name of the column to create.
        referrer_table_oid: The OID of the table getting the new column.
        referent_table_oid: The OID of the table being referenced.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        links_create.add_foreign_key_column(
            conn, column_name, referrer_table_oid, referent_table_oid
        )
