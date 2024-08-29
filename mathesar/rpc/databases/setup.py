"""
RPC functions for setting up database connections.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_superuser_required

from mathesar.utils import permissions
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.servers.configured import ServerInfo
from mathesar.rpc.databases.configured import DatabaseInfo
from mathesar.rpc.roles.configured import ConfiguredRoleInfo


class DatabaseConnectionResult(TypedDict):
    """
    Info about the objects resulting from calling the setup functions.

    These functions will get or create an instance of the Server,
    Database, and ConfiguredRole models, as well as a UserDatabaseRoleMap entry.

    Attributes:
        server: Information on the Server model instance.
        database: Information on the Database model instance.
        configured_role: Information on the ConfiguredRole model instance.
    """
    server: ServerInfo
    database: DatabaseInfo
    configured_role: ConfiguredRoleInfo

    @classmethod
    def from_model(cls, model):
        return cls(
            server=ServerInfo.from_model(model.server),
            database=DatabaseInfo.from_model(model.database),
            configured_role=ConfiguredRoleInfo.from_model(model.configured_role),
        )


@rpc_method(name='databases.setup.create_new')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def create_new(
        *,
        database: str,
        sample_data: list[str] = [],
        **kwargs
) -> DatabaseConnectionResult:
    """
    Set up a new database on the internal server.

    The calling user will get access to that database using the default
    role stored in Django settings.

    Args:
        database: The name of the new database.
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.
    """
    user = kwargs.get(REQUEST_KEY).user
    result = permissions.set_up_new_database_for_user_on_internal_server(
        database, user, sample_data=sample_data
    )
    return DatabaseConnectionResult.from_model(result)


@rpc_method(name='databases.setup.connect_existing')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def connect_existing(
        *,
        host: str,
        port: int,
        database: str,
        role: str,
        password: str,
        sample_data: list[str] = [],
        **kwargs
) -> DatabaseConnectionResult:
    """
    Connect Mathesar to an existing database on a server.

    The calling user will get access to that database using the
    credentials passed to this function.

    Args:
        host: The host of the database server.
        port: The port of the database server.
        database: The name of the database on the server.
        role: The role on the server to use for the connection.
        password: A password valid for the role.
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.
    """
    user = kwargs.get(REQUEST_KEY).user
    result = permissions.set_up_preexisting_database_for_user(
        host, port, database, role, password, user, sample_data=sample_data
    )
    return DatabaseConnectionResult.from_model(result)
