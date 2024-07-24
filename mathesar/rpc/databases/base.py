from typing import TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.models.base import Database
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class DatabaseInfo(TypedDict):
    """
    Information about a database.

    Attributes:
        id: the Django ID of the database model instance.
        name: The name of the database on the server.
        server_id: the Django ID of the server model instance for the database.
    """
    id: int
    name: str
    server_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            name=model.name,
            server_id=model.server.id
        )


@rpc_method(name="databases.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, server_id: int = None, **kwargs) -> list[DatabaseInfo]:
    """
    List information about databases for a server. Exposed as `list`.

    If called with no `server_id`, all databases for all servers are listed.

    Args:
        server_id: The Django id of the server containing the databases.

    Returns:
        A list of database details.
    """
    if server_id is not None:
        database_qs = Database.objects.filter(server__id=server_id)
    else:
        database_qs = Database.objects.all()

    return [DatabaseInfo.from_model(db_model) for db_model in database_qs]
