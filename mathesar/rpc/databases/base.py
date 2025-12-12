from typing import Literal, TypedDict, Optional

from modernrpc.core import REQUEST_KEY

from db.databases import get_database, drop_database
from mathesar.models.base import Database, ConfiguredRole
from mathesar.rpc.utils import connect
from mathesar.rpc.decorators import mathesar_rpc_method


class DatabaseInfo(TypedDict):
    """
    Information about a database current user privileges on it.

    Attributes:
        oid: The `oid` of the database on the server.
        name: The name of the database on the server.
        owner_oid: The `oid` of the owner of the database.
        current_role_priv: A list of privileges available to the user.
        current_role_owns: Whether the user is an owner of the database.
    """
    oid: int
    name: str
    owner_oid: int
    current_role_priv: list[Literal["CONNECT", "CREATE", "TEMPORARY"]]
    current_role_owns: bool

    @classmethod
    def from_dict(cls, d):
        return cls(
            oid=d["oid"],
            name=d["name"],
            owner_oid=d["owner_oid"],
            current_role_priv=d["current_role_priv"],
            current_role_owns=d["current_role_owns"]
        )


@mathesar_rpc_method(name="databases.get", auth="login")
def get(*, database_id: int, **kwargs) -> DatabaseInfo:
    """
    Get information about a database.

    Args:
        database_id: The Django id of the database.

    Returns:
        Information about the database, and the current user privileges.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        db_info = get_database(conn)
    return DatabaseInfo.from_dict(db_info)


@mathesar_rpc_method(name="databases.delete", auth="login")
def delete(*, database_oid: int, database_id: int, **kwargs) -> None:
    """
    Drop a database from the server.

    Args:
        database_oid: The OID of the database to delete on the database.
        database_id: The Django id of the database to connect to.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        drop_database(database_oid, conn)


@mathesar_rpc_method(name="databases.upgrade_sql")
def upgrade_sql(
        *, database_id: int, username: str = None, password: str = None
) -> None:
    """
    Install, Upgrade, or Reinstall the Mathesar SQL on a database.

    If no `username` and `password` are submitted, we will first check if a
    default upgrade role is configured for the database. If so, we use that
    role's credentials. Otherwise, we determine the role which owns the
    `msar` schema on the database, then use that role for the upgrade.

    If a `username` is provided without a `password`, we will try to find a
    configured role with that name and use its stored password.

    Args:
        database_id: The Django id of the database.
        username: The username of the role used for upgrading.
        password: The password of the role used for upgrading.
    """
    database = Database.objects.get(id=database_id)
    
    # If no credentials provided, try to use the default upgrade role
    if username is None and password is None:
        if database.default_upgrade_role:
            username = database.default_upgrade_role.name
            password = database.default_upgrade_role.password
    # If username provided but no password, look up configured role
    elif username is not None and password is None:
        try:
            configured_role = ConfiguredRole.objects.get(
                name=username, server=database.server
            )
            password = configured_role.password
        except ConfiguredRole.DoesNotExist:
            # If no configured role found, let the function proceed
            # It will try to find the role that owns the msar schema
            pass
    
    database.install_sql(username=username, password=password)


@mathesar_rpc_method(name="databases.set_default_upgrade_role")
def set_default_upgrade_role(
        *, database_id: int, configured_role_id: Optional[int] = None
) -> None:
    """
    Set the default configured role to use for database upgrades.

    This role will be automatically used when upgrading the database if no
    specific credentials are provided.

    Args:
        database_id: The Django id of the database.
        configured_role_id: The Django id of the ConfiguredRole to use as default.
            If None, clears the default upgrade role.
    """
    database = Database.objects.get(id=database_id)
    
    if configured_role_id is not None:
        configured_role = ConfiguredRole.objects.get(id=configured_role_id)
        # Verify the configured role is for the same server
        if configured_role.server_id != database.server_id:
            raise ValueError("Configured role must be from the same server as the database")
        database.default_upgrade_role = configured_role
    else:
        database.default_upgrade_role = None
    
    database.save()
