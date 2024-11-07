from typing import Literal, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import (
    http_basic_auth_login_required,
    http_basic_auth_superuser_required,
)

from db.databases import get_database, drop_database
from mathesar.models.base import Database
from mathesar.rpc.utils import connect
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


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
    current_role_priv: list[Literal['CONNECT', 'CREATE', 'TEMPORARY']]
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


@rpc_method(name="databases.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
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


@rpc_method(name="databases.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
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


@rpc_method(name="databases.upgrade_sql")
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def upgrade_sql(
        *, database_id: int, username: str = None, password: str = None
) -> None:
    """
    Install, Upgrade, or Reinstall the Mathesar SQL on a database.

    The default is to first determine the role which owns the `msar`
    schema on the database, then use that role for the upgrade.

    Args:
        database_id: The Django id of the database.
        username: The username of the role used for upgrading.
        password: The password of the role used for upgrading.
    """
    database = Database.objects.get(id=database_id)
    database.install_sql(username=username, password=password)
