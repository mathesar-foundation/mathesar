"""
Functions exposed to the RPC endpoint for creating connections.
"""
from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_superuser_required

from mathesar.utils import connections

@rpc_method(name='connections.create_from_known_connection')
@http_basic_auth_superuser_required
def create_from_known_connection(
        *,
        nickname: str,
        db_name: str,
        create_db: bool=False,
        connection_type: str='internal_database',
        connection_id: int=None,
        sample_data: list[str]=[],
) -> int:
    """
    Create a new connection from an already existing one.

    When using `connection_type`='user_database', the `connection_id`
    parameter is required.

    Args:
        nickname: Used to identify the created connection
        db_name: The name of the database on the server.
        create_db: Whether we should create the database `db_name` if it
            doesn't already exist.
        connection_type: Type of the known connection - one of
            'internal_database' or 'user_database'
        connection_id: Identifies the known connection when combined with
            the user_database value for the connection_type parameter
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.

    Returns:
        The Django id of the Database object associated with the connection.
    """
    connection = {
        'connection_type': connection_type, 'connection_id': connection_id
    }
    db_model = connections.copy_connection_from_preexisting(
        connection, nickname, db_name, create_db, sample_data
    )
    return db_model.id


@rpc_method(name='connections.create_from_scratch')
@http_basic_auth_superuser_required
def create_from_scratch(
        *,
        nickname: str,
        db_name: str,
        user: str,
        password: str,
        host: str,
        port: str,
        sample_data: list[str]=[],
) -> int:
    """
    Create a new connection to a PostgreSQL server from scratch.

    This requires inputting valid credentials for the connection. When
    setting up the connection, therefore, the `db_name` must already
    exist on the PostgreSQL server.

    Args:
        nickname: Used to identify the created connection.
        db_name: The name of the database on the server.
        user: A valid user (role) on the server, with `CONNECT` and
            `CREATE` privileges on the database given by `db_name`.
        password: The password for `user`.
        host: The hostname or IP address of the PostgreSQL server.
        port: The port of the PostgreSQL server.
        sample_data: A list of strings requesting that some example data
            sets be installed on the underlying database. Valid list
            members are 'library_management' and 'movie_collection'.

    Returns:
        The Django id of the Database object associated with the connection.
    """
    db_model = connections.create_connection_from_scratch(
        user, password, host, port, nickname, db_name, sample_data
    )
    return db_model.id
