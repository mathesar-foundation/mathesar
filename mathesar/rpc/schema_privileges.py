from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.roles.operations.select import list_schema_privileges
from mathesar.rpc.utils import connect
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


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


@rpc_method(name="schema_privileges.list_direct")
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
