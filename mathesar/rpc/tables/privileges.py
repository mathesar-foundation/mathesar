from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.roles.operations.ownership import transfer_table_ownership
from db.roles.operations.select import list_table_privileges
from db.roles.operations.update import replace_table_privileges_for_roles
from mathesar.rpc.utils import connect
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.tables.base import TableInfo


class TablePrivileges(TypedDict):
    """
    Information about table privileges for a role.
    Attributes:
        role_oid: The `oid` of the role.
        direct: A list of table privileges for the afforementioned role_oid.
    """
    role_oid: int
    direct: list[Literal['INSERT', 'SELECT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']]

    @classmethod
    def from_dict(cls, d):
        return cls(
            role_oid=d["role_oid"],
            direct=d["direct"]
        )


@rpc_method(name="tables.privileges.list_direct")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_direct(
        *, table_oid: int, database_id: int, **kwargs
) -> list[TablePrivileges]:
    """
    List direct table privileges for roles.
    Args:
        table_oid: The OID of the table whose privileges we'll list.
        database_id: The Django id of the database containing the table.
    Returns:
        A list of table privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_priv = list_table_privileges(table_oid, conn)
    return [TablePrivileges.from_dict(i) for i in raw_priv]


@rpc_method(name="tables.privileges.replace_for_roles")
@http_basic_auth_login_required
@handle_rpc_exceptions
def replace_for_roles(
    *,
    privileges: list[TablePrivileges], table_oid: int, database_id: int,
    **kwargs
) -> list[TablePrivileges]:
    """
    Replace direct table privileges for roles.

    Possible privileges are `INSERT`, `SELECT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` and `TRIGGER`.

    Only roles which are included in a passed `TablePrivileges` object
    are affected.

    WARNING: Any privilege included in the `direct` list for a role
    is GRANTed, and any privilege not included is REVOKEd.

    Args:
        privileges: The new privilege sets for roles.
        table_oid: The OID of the affected table.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of all non-default privileges on the table after the
        operation.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_priv = replace_table_privileges_for_roles(
            conn, table_oid, [TablePrivileges.from_dict(i) for i in privileges]
        )
    return [TablePrivileges.from_dict(i) for i in raw_priv]


@rpc_method(name="tables.privileges.transfer_ownership")
@http_basic_auth_login_required
@handle_rpc_exceptions
def transfer_ownership(*, table_oid: int, new_owner_oid: int, database_id: int, **kwargs) -> TableInfo:
    """
    Transfers ownership of a given table to a new owner.

    Args:
        tab_id: The OID of the table to transfer.
        new_owner_oid: The OID of the role whom we want to be the new owner of the table.

    Note: To successfully transfer ownership of a table to a new owner the current user must:
        - Be a Superuser/Owner of the table.
        - Be a `MEMBER` of the new owning role. i.e. The current role should be able to `SET ROLE`
          to the new owning role.
        - Have `CREATE` privilege on the table's schema.

    Returns:
        Information about the table, and the current user privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        table_info = transfer_table_ownership(table_oid, new_owner_oid, conn)
    return TableInfo(table_info)
