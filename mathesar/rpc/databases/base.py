from typing import Literal, TypedDict

from modernrpc.core import REQUEST_KEY

from db.databases import get_database, drop_database
from db.sql.install import install_mathesar_types
from mathesar.models.base import Database
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
        database_oid: The OID of the database to delete.
        database_id: The Django id of the database to connect to.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        drop_database(database_oid, conn)


@mathesar_rpc_method(name="databases.install_types", auth="login")
def install_types(*, database_id: int, **kwargs) -> None:
    """
    Install Mathesar custom types (email, uri, money, etc.) on a database.

    This creates the mathesar_types schema with custom type definitions.
    Types are optional and can be installed after connecting a database.

    The user's role must have permission to create schemas for this to work.

    Args:
        database_id: The Django id of the database.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        install_mathesar_types(conn)
