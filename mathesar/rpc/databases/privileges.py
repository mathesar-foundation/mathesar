from typing import Literal, TypedDict

from modernrpc.core import REQUEST_KEY

from db.roles import (
    list_db_priv,
    replace_database_privileges_for_roles,
    transfer_database_ownership,
)
from mathesar.rpc.databases.base import DatabaseInfo
from mathesar.rpc.utils import connect
from mathesar.rpc.decorators import mathesar_rpc_method


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


@mathesar_rpc_method(name="databases.privileges.list_direct", auth="login")
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


@mathesar_rpc_method(name="databases.privileges.replace_for_roles", auth="login")
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

    Attributes:
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


@mathesar_rpc_method(name="databases.privileges.transfer_ownership", auth="login")
def transfer_ownership(*, new_owner_oid: int, database_id: int, **kwargs) -> DatabaseInfo:
    """
    Transfers ownership of the current database to a new owner.

    Attributes:
        new_owner_oid: The OID of the role whom we want to be the new owner of the current database.
        database_id: The Django id of the database whose ownership is to be transferred.

    Note: To successfully transfer ownership of a database to a new owner the current user must:
        - Be a Superuser/Owner of the current database.
        - Be a `MEMBER` of the new owning role. i.e. The current role should be able to `SET ROLE`
          to the new owning role.
        - Have `CREATEDB` privilege.

    Returns:
        Information about the database, and the current user privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        db_info = transfer_database_ownership(new_owner_oid, conn)
    return DatabaseInfo.from_dict(db_info)
