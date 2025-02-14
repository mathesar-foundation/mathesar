from typing import TypedDict, Optional

from mathesar.models.base import Server
from mathesar.rpc.decorators import mathesar_rpc_method


class ConfiguredServerInfo(TypedDict):
    """
    Information about a database server.

    Attributes:
        id: the Django ID of the server model instance.
        host: The host of the database server.
        port: the port of the database server.
    """
    id: int
    host: str
    port: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            host=model.host,
            port=model.port
        )


class ConfiguredServerPatch(TypedDict):
    """
    Information to be changed about a server

    Attributes:
        host: The host of the database server.
        port: the port of the database server.
    """
    host: Optional[str]
    port: Optional[int]


@mathesar_rpc_method(name="servers.configured.list", auth="login")
def list_() -> list[ConfiguredServerInfo]:
    """
    List information about servers. Exposed as `list`.

    Returns:
        A list of server details.
    """
    server_qs = Server.objects.all()

    return [ConfiguredServerInfo.from_model(db_model) for db_model in server_qs]


@mathesar_rpc_method(name="servers.configured.patch")
def patch(*, server_id: int, patch: ConfiguredServerPatch, **kwargs) -> ConfiguredServerInfo:
    """
    Patch a server, given its id.

    Args:
        server: The Django id of the server
        patch: An object containing the fields to update.

    Returns:
        An object describing the server.
    """
    server = Server.objects.get(id=server_id)
    if "host" in patch:
        server.host = patch.get("host")
    if "port" in patch:
        server.port = patch.get("port")
    server.save()
    return ConfiguredServerInfo.from_model(server)
