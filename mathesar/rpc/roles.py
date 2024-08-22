"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from db.roles.operations.select import list_roles
from db.roles.operations.create import create_role


class RoleMember(TypedDict):
    """
    Information about a member role of a directly inherited role.

    Attributes:
        oid: The OID of the member role.
        admin: Whether the member role has ADMIN option on the inherited role.
    """
    oid: int
    admin: bool


class RoleInfo(TypedDict):
    """
    Information about a role.

    Attributes:
        oid: The OID of the role.
        name: Name of the role.
        super: Whether the role has SUPERUSER status.
        inherits: Whether the role has INHERIT attribute.
        create_role: Whether the role has CREATEROLE attribute.
        create_db: Whether the role has CREATEDB attribute.
        login: Whether the role has LOGIN attribute.
        description: A description of the role
        members: The member roles that directly inherit the role.

    Refer PostgreSQL documenation on:
        - [pg_roles table](https://www.postgresql.org/docs/current/view-pg-roles.html).
        - [Role attributes](https://www.postgresql.org/docs/current/role-attributes.html)
        - [Role membership](https://www.postgresql.org/docs/current/role-membership.html)
    """
    oid: int
    name: str
    super: bool
    inherits: bool
    create_role: bool
    create_db: bool
    login: bool
    description: Optional[str]
    members: Optional[list[RoleMember]]

    @classmethod
    def from_dict(cls, d):
        return cls(
            oid=d["oid"],
            name=d["name"],
            super=d["super"],
            inherits=d["inherits"],
            create_role=d["create_role"],
            create_db=d["create_db"],
            login=d["login"],
            description=d["description"],
            members=d["members"]
        )


@rpc_method(name="roles.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[RoleInfo]:
    """
    List information about roles for a database server. Exposed as `list`.
    Requires a database id inorder to connect to the server.

    Args:
        database_id: The Django id of the database.

    Returns:
        A list of roles present on the database server.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        roles = list_roles(conn)
    return [RoleInfo.from_dict(role) for role in roles]


@rpc_method(name="roles.add")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add(
    *,
    rolename: str,
    database_id: int,
    password: str = None,
    login: bool = None,
    **kwargs
) -> RoleInfo:
    """
    Add a new login/non-login role on a database server.

    Args:
        rolename: The name of the role to be created.
        database_id: The Django id of the database.
        password: The password for the rolename to set.
        login: Whether the role to be created could login.

    Returns:
        A dict describing the created role.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        role = create_role(rolename, password, login, conn)
    return RoleInfo.from_dict(role)
