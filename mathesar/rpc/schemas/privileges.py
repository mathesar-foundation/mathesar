from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.roles.operations.ownership import transfer_schema_ownership
from db.roles.operations.select import list_schema_privileges
from db.roles.operations.update import replace_schema_privileges_for_roles
from mathesar.rpc.utils import connect
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.schemas.base import SchemaInfo


class SchemaPrivileges(TypedDict):
    """
    Information about schema privileges for a role.

    Attributes:
        role_oid: The `oid` of the role.
        direct: A list of schema privileges for the afforementioned role_oid.
    """
    role_oid: int
    direct: list[Literal['USAGE', 'CREATE']]

    @classmethod
    def from_dict(cls, d):
        return cls(
            role_oid=d["role_oid"],
            direct=d["direct"]
        )


@rpc_method(name="schemas.privileges.list_direct")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_direct(
        *, schema_oid: int, database_id: int, **kwargs
) -> list[SchemaPrivileges]:
    """
    List direct schema privileges for roles.

    Args:
        schema_oid: The OID of the schema whose privileges we'll list.
        database_id: The Django id of the database containing the schema.

    Returns:
        A list of schema privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_priv = list_schema_privileges(schema_oid, conn)
    return [SchemaPrivileges.from_dict(i) for i in raw_priv]


@rpc_method(name="schemas.privileges.replace_for_roles")
@http_basic_auth_login_required
@handle_rpc_exceptions
def replace_for_roles(
        *,
        privileges: list[SchemaPrivileges], schema_oid: int, database_id: int,
        **kwargs
) -> list[SchemaPrivileges]:
    """
    Replace direct schema privileges for roles.

    Possible privileges are `USAGE` and `CREATE`.

    Only roles which are included in a passed `SchemaPrivileges` object
    are affected.

    WARNING: Any privilege included in the `direct` list for a role
    is GRANTed, and any privilege not included is REVOKEd.

    Args:
        privileges: The new privilege sets for roles.
        schema_oid: The OID of the affected schema.
        database_id: The Django id of the database containing the schema.

    Returns:
        A list of all non-default privileges on the schema after the
        operation.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_priv = replace_schema_privileges_for_roles(
            conn, schema_oid, [SchemaPrivileges.from_dict(i) for i in privileges]
        )
    return [SchemaPrivileges.from_dict(i) for i in raw_priv]


@rpc_method(name="schemas.privileges.transfer_ownership")
@http_basic_auth_login_required
@handle_rpc_exceptions
def transfer_ownership(*, schema_oid: int, new_owner_oid: int, database_id: int, **kwargs) -> SchemaInfo:
    """
    Transfers ownership of a given schema to a new owner.

    Attributes:
        schema_oid: The OID of the schema to transfer.
        new_owner_oid: The OID of the role whom we want to be the new owner of the schema.

    Note: To successfully transfer ownership of a schema to a new owner the current user must:
        - Be a Superuser/Owner of the schema.
        - Be a `MEMBER` of the new owning role. i.e. The current role should be able to `SET ROLE`
          to the new owning role.
        - Have `CREATE` privilege for the database.

    Returns:
        Information about the schema, and the current user privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        schema_info = transfer_schema_ownership(schema_oid, new_owner_oid, conn)
    return SchemaInfo(schema_info)
