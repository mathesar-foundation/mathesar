from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.roles.operations.select import list_db_priv
from db.roles.operations.update import replace_database_privileges_for_roles
from mathesar.rpc.utils import connect
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class DBPrivileges(TypedDict):
    """
    Information about database privileges.

    Attributes:
        role_oid: The `oid` of the role on the database server.
        direct: A list of database privileges for the afforementioned role_oid.
    """
    role_oid: int
    direct: list[Literal['CONNECT', 'CREATE', 'TEMPORARY']]

    @classmethod
    def from_dict(cls, d):
        return cls(
            role_oid=d["role_oid"],
            direct=d["direct"]
        )


@rpc_method(name="databases.privileges.list_direct")
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
        raw_db_priv = list_db_priv(conn)
    return [DBPrivileges.from_dict(i) for i in raw_db_priv]


@rpc_method(name="databases.privileges.replace_for_roles")
@http_basic_auth_login_required
@handle_rpc_exceptions
def replace_for_roles(
        *, privileges: list[DBPrivileges], database_id: int, **kwargs
) -> list[DBPrivileges]:
    """
    Replace direct database privileges for roles.

    Possible privileges are `CONNECT`, `CREATE`, and `TEMPORARY`.

    Only roles which are included in a passed `DBPrivileges` object are
    affected.

    WARNING: Any privilege included in the `direct` list for a role
    is GRANTed, and any privilege not included is REVOKEd.

    Args:
        privileges: The new privilege sets for roles.
        database_id: The Django id of the database.

    Returns:
        A list of all non-default privileges on the database after the
        operation.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_db_priv = replace_database_privileges_for_roles(
            conn, [DBPrivileges.from_dict(i) for i in privileges]
        )
    return [DBPrivileges.from_dict(i) for i in raw_db_priv]
