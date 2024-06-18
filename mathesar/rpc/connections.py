"""
Classes and functions exposed to the RPC endpoint for creating connections.
"""
from typing import TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_superuser_required

from mathesar.utils import connections, permissions
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class DBModelReturn(TypedDict):
    """
    Information about a database model.

    Attributes:
        id (int): The Django id of the Database object added.
        nickname (str): Used to identify the added connection.
        database (str): The name of the database on the server.
        username (str): The username of the role for the connection.
        host (str): The hostname or IP address of the Postgres server.
        port (int): The port of the Postgres server.
    """
    id: int
    nickname: str
    database: str
    username: str
    host: str
    port: int

    @classmethod
    def from_db_model(cls, db_model):
        return cls(
            id=db_model.id,
            nickname=db_model.name,
            database=db_model.db_name,
            username=db_model.username,
            host=db_model.host,
            port=db_model.port
        )


@rpc_method(name='connections.add_from_known_connection')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def add_from_known_connection(
        *,
        nickname: str,
        database: str,
        create_db: bool = False,
        connection_id: int = None,
        sample_data: list[str] = [],
) -> DBModelReturn:
    """
    Add a new connection from an already existing one.

    If no `connection_id` is passed, the internal database connection
    will be used.

    Args:
        nickname: Identify the added connection. Should be unique.
        database: The name of the database on the server.
        create_db: Whether we should create the database `database` if it
            doesn't already exist.
        connection_id: Identifies the known connection when combined with
            the user_database value for the connection_type parameter
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.

    Returns:
        Metadata about the Database associated with the connection.
    """
    if connection_id is not None:
        connection_type = 'user_database'
    else:
        connection_type = 'internal_database'
    connection = {
        'connection_type': connection_type,
        'connection_id': connection_id
    }
    db_model = connections.copy_connection_from_preexisting(
        connection, nickname, database, create_db, sample_data
    )
    return DBModelReturn.from_db_model(db_model)


@rpc_method(name='connections.add_from_scratch')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def add_from_scratch(
        *,
        nickname: str,
        database: str,
        user: str,
        password: str,
        host: str,
        port: int,
        sample_data: list[str] = [],
) -> DBModelReturn:
    """
    Add a new connection to a PostgreSQL server from scratch.

    This requires inputting valid credentials for the connection. When
    setting up the connection, therefore, the `database` must already
    exist on the PostgreSQL server.

    Args:
        nickname: Identify the added connection. Should be unique.
        database: The name of the database on the server.
        user: A valid user (role) on the server, with `CONNECT` and
            `CREATE` privileges on the database given by `database`.
        password: The password for `user`.
        host: The hostname or IP address of the PostgreSQL server.
        port: The port of the PostgreSQL server.
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.

    Returns:
        Metadata about the Database associated with the connection.
    """
    db_model = connections.create_connection_from_scratch(
        user, password, host, port, nickname, database, sample_data
    )
    return DBModelReturn.from_db_model(db_model)


@rpc_method(name='connections.grant_access_to_user')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def grant_access_to_user(*, connection_id: int, user_id: int):
    """
    Migrate a connection to new models, grant access for a user.

    This function is designed to be temporary, and should probably be
    removed once we have completed the new users and permissions setup
    for beta. You pass any conneciton id and user id. The function will
    fill the required models as needed.

    Args:
        connection_id: The Django id of an old-style connection.
        user_id: The Django id of a user.
    """
    permissions.create_user_database_role_map(connection_id, user_id)
