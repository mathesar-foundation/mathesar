"""
RPC functions for setting up database connections.
"""
from typing import TypedDict

from modernrpc.core import REQUEST_KEY

from mathesar.utils import permissions
from mathesar.rpc.servers.configured import ConfiguredServerInfo
from mathesar.rpc.databases.configured import ConfiguredDatabaseInfo
from mathesar.rpc.roles.configured import ConfiguredRoleInfo
from mathesar.rpc.decorators import mathesar_rpc_method


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
    server: ConfiguredServerInfo
    database: ConfiguredDatabaseInfo
    configured_role: ConfiguredRoleInfo

    @classmethod
    def from_model(cls, model):
        return cls(
            server=ConfiguredServerInfo.from_model(model.server),
            database=ConfiguredDatabaseInfo.from_model(model.database),
            configured_role=ConfiguredRoleInfo.from_model(model.configured_role),
        )


@mathesar_rpc_method(name='databases.setup.create_new')
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
            members are:
            - 'bike_shop'
            - 'hardware_store'
            - 'ice_cream_employees'
            - 'library_management'
            - 'library_makerspace'
            - 'movie_collection'
            - 'museum_exhibits'
            - 'nonprofit_grants'
    """
    user = kwargs.get(REQUEST_KEY).user
    result = permissions.set_up_new_database_for_user_on_internal_server(
        database, user, sample_data=sample_data
    )
    return DatabaseConnectionResult.from_model(result)


@mathesar_rpc_method(name='databases.setup.connect_existing')
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
            members are:
            - 'bike_shop'
            - 'hardware_store'
            - 'ice_cream_employees'
            - 'library_management'
            - 'library_makerspace'
            - 'movie_collection'
            - 'museum_exhibits'
            - 'nonprofit_grants'
    """
    user = kwargs.get(REQUEST_KEY).user
    result = permissions.set_up_preexisting_database_for_user(
        host, port, database, role, password, user, sample_data=sample_data
    )
    return DatabaseConnectionResult.from_model(result)
