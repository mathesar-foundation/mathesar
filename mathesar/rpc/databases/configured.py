from typing import TypedDict, Optional

from modernrpc.core import REQUEST_KEY

from mathesar.models.base import Database
from mathesar.rpc.decorators import mathesar_rpc_method


class ConfiguredDatabaseInfo(TypedDict):
    """
    Information about a database.

    Attributes:
        id: the Django ID of the database model instance.
        name: The name of the database on the server.
        server_id: the Django ID of the server model instance for the database.
        last_confirmed_sql_version: The last version of the SQL scripts which
            were confirmed to have been run on this database.
        needs_upgrade_attention: This is `True` if the SQL version isn't the
            same as the service version.
        nickname: A optional user-configurable name for the database.
    """
    id: int
    name: str
    server_id: int
    last_confirmed_sql_version: str
    needs_upgrade_attention: bool
    nickname: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            name=model.name,
            server_id=model.server.id,
            last_confirmed_sql_version=model.last_confirmed_sql_version,
            needs_upgrade_attention=model.needs_upgrade_attention,
            nickname=model.nickname,
        )


class ConfiguredDatabasePatch(TypedDict):
    """
    Information to be changed about a configured database

    Attributes:
        name: The name of the database on the server.
        nickname: A optional user-configurable name for the database.
    """
    name: Optional[str]
    nickname: Optional[str]


@mathesar_rpc_method(name="databases.configured.list", auth='login')
def list_(*, server_id: int = None, **kwargs) -> list[ConfiguredDatabaseInfo]:
    """
    List information about databases for a server. Exposed as `list`.

    If called with no `server_id`, all databases for all servers are listed.

    Args:
        server_id: The Django id of the server containing the databases.

    Returns:
        A list of database details.
    """
    user = kwargs.get(REQUEST_KEY).user
    if user.is_superuser:
        database_qs = Database.objects.filter(
            server__id=server_id
        ) if server_id is not None else Database.objects.all()
    else:
        database_qs = Database.objects.filter(
            server__id=server_id,
            userdatabaserolemap__user=user
        ) if server_id is not None else Database.objects.filter(
            userdatabaserolemap__user=user
        )

    return [ConfiguredDatabaseInfo.from_model(db_model) for db_model in database_qs]


@mathesar_rpc_method(name="databases.configured.patch")
def patch(*, database_id: int, patch: ConfiguredDatabasePatch, **kwargs) -> ConfiguredDatabaseInfo:
    """
    Patch a configured database, given its id.

    Args:
        database_id: The Django id of the database.
        patch: An object containing the fields to update.

    Returns:
        An object describing the database.
    """
    database = Database.objects.get(id=database_id)
    if "name" in patch:
        database.name = patch.get("name")
    if "nickname" in patch:
        database.nickname = patch.get("nickname")
    database.save()
    return ConfiguredDatabaseInfo.from_model(database)


@mathesar_rpc_method(name="databases.configured.disconnect")
def disconnect(
        *,
        database_id: int,
        disconnect_db_server: bool = False
) -> None:
    """
    Disconnect a configured database.

    This removes the database record from Mathesar. It does NOT modify
    the PostgreSQL database in any way. To remove Mathesar schemas from
    the database, use databases.remove_mathesar_schemas first.

    Args:
        database_id: The Django id of the database.
        disconnect_db_server: If True, will delete the stored server
            metadata (host, port, role credentials) from Mathesar.
            This is intended for optional use while disconnecting the
            last database on the server.
    """
    database = Database.objects.get(id=database_id)
    server = database.server
    database.delete()

    if disconnect_db_server:
        remaining = Database.objects.filter(server=server).count()
        if remaining == 0:
            server.delete()
