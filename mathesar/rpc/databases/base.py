from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.utils import connect
from db.roles.operations.select import get_curr_role_db_priv
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class CurrentDBPrivileges(TypedDict):
    """
    Information about database privileges for current user.

    Attributes:
        owner_oid: The `oid` of the owner of the database.
        current_role_priv: A list of privileges available to the user.
        current_role_owns: Whether the user is an owner of the database.
    """
    owner_oid: int
    current_role_priv: list[Literal['CONNECT', 'CREATE', 'TEMPORARY']]
    current_role_owns: bool

    @classmethod
    def from_dict(cls, d):
        return cls(
            owner_oid=d["owner_oid"],
            current_role_priv=d["current_role_priv"],
            current_role_owns=d["current_role_owns"]
        )


@rpc_method(name="databases.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def get(*, database_id: int, **kwargs) -> CurrentDBPrivileges:
    """
    Get database privileges for the current user.

    Args:
        database_id: The Django id of the database.

    Returns:
        A dict describing current user's database privilege.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        curr_role_db_priv = get_curr_role_db_priv(conn)
    return CurrentDBPrivileges.from_dict(curr_role_db_priv)
