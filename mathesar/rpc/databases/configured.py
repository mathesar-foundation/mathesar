from typing import TypedDict

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
    """
    id: int
    name: str
    server_id: int
    last_confirmed_sql_version: str
    needs_upgrade_attention: bool

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            name=model.name,
            server_id=model.server.id,
            last_confirmed_sql_version=model.last_confirmed_sql_version,
            needs_upgrade_attention=model.needs_upgrade_attention,
        )


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


@mathesar_rpc_method(name="databases.configured.disconnect")
def disconnect(
        *,
        database_id: int,
        schemas_to_remove: list[str] = ['msar', '__msar', 'mathesar_types'],
        strict: bool = True,
        role_name: str = None,
        password: str = None,
        disconnect_db_server: bool = False
) -> None:
    """
    Disconnect a configured database, after removing Mathesar SQL from it.

    If no `role_name` and `password` are submitted, we will determine the
    role which owns the `msar` schema on the database, then use that role
    for the SQL removal.

    All removals are performed safely, and without `CASCADE`. This is to
    make sure the user can't accidentally lose data calling this
    function.

    Args:
        database_id: The Django id of the database.
        schemas_to_remove: Mathesar schemas we should remove SQL from.
        strict: If True, we throw an exception and roll back changes if
            we fail to remove any objects which we expected to remove.
        role_name: the username of the role used for upgrading.
        password: the password of the role used for upgrading.
        disconnect_db_server: If True, will delete the stored server
            metadata(host, port, role credentials) and also disconnect
            all the databases associated with that server from Mathesar.
            This is intended for optional use while disconnecting the
            last database on the server.
    """
    database = Database.objects.get(id=database_id)
    database.uninstall_sql(
        schemas_to_remove=schemas_to_remove,
        strict=strict,
        role_name=role_name,
        password=password,
    )
    database.delete()
    if disconnect_db_server:
        database.server.delete()
