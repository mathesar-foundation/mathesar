"""
RPC functions for setting up database connections.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_superuser_required

from mathesar.utils import permissions
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class DatabaseConnectionResult(TypedDict):
    """
    Info about the objects resulting from calling the setup functions.

    These functions will get or create an instance of the Server,
    Database, and ConfiguredRole models, as well as a UserDatabaseRoleMap entry.

    Attributes:
        server_id: The Django ID of the Server model instance.
        database_id: The Django ID of the Database model instance.
        configured_role_id: The Django ID of the ConfiguredRole model instance.
    """
    server_id: int
    database_id: int
    configured_role_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            server_id=model.server.id,
            database_id=model.database.id,
            configured_role_id=model.configured_role.id,
        )


@rpc_method(name='database_setup.create_new')
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


@rpc_method(name='database_setup.connect_existing')
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
