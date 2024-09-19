from typing import TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.models.base import Server
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


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


@rpc_method(name="servers.configured.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_() -> list[ConfiguredServerInfo]:
    """
    List information about servers. Exposed as `list`.

    Returns:
        A list of server details.
    """
    server_qs = Server.objects.all()

    return [ConfiguredServerInfo.from_model(db_model) for db_model in server_qs]
