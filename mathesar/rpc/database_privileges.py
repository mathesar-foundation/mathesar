from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.roles.operations.select import list_db_priv
from mathesar.rpc.utils import connect
from mathesar.models.base import Database
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class DBPrivileges(TypedDict):
    """
    Information about database privileges.

    Attributes:
        role_oid: The `oid` of the role on the database server.
        direct: A list of database privileges for the afforementioned role_oid.
    """
    role_oid: int
    direct: list[str]

    @classmethod
    def from_dict(cls, d):
        return cls(
            role_oid=d["role_oid"],
            direct=d["direct"]
        )


@rpc_method('database_privileges.list_direct')
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_direct(*, database_id: int, **kwargs) -> list[DBPrivileges]:
    """
    List database privileges for non-inherited roles.

    Args:
        database_id: The Django id of the database.

    Returns:
        A list of database privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        db_name = Database.objects.get(id=database_id).name
        raw_db_priv = list_db_priv(db_name, conn)
    return [DBPrivileges.from_dict(i) for i in raw_db_priv]
