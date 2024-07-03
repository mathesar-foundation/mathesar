"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from db.roles.operations.select import get_roles


class RoleMembers(TypedDict):
    oid: int
    admin: bool


class RoleInfo(TypedDict):
    oid: int
    name: str
    super: bool
    inherits: bool
    create_role: bool
    create_db: bool
    login: bool
    description: Optional[str]
    members: Optional[list[RoleMembers]]


@rpc_method(name="roles.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[RoleInfo]:
    """
    List information about roles for a database server. Exposed as `list`.
    Requires a database id inorder to connect to the server.
    Args:
        database_id: The Django id of the database containing the table.
    Returns:
        A list of roles present on the database server.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        roles = get_roles(conn)

    return roles
