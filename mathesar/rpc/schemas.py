"""
Classes and functions exposed to the RPC endpoint for managing schemas.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.constants import INTERNAL_SCHEMAS
from db.schemas.operations.select import get_schemas
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class SchemaInfo(TypedDict):
    """
    Information about a schema

    Attributes:
        oid: The OID of the schema
        name: The name of the schema
        description: A description of the schema
        table_count: The number of tables in the schema
        exploration_count: The number of explorations in the schema
    """
    oid: int
    name: str
    description: Optional[str]
    table_count: int
    exploration_count: int


@rpc_method(name="schemas.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[SchemaInfo]:
    """
    List information about schemas in a database. Exposed as `list`.

    Args:
        database_id: The Django id of the database containing the table.

    Returns:
        A list of schema details
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        schemas = get_schemas(conn)

    user_defined_schemas = [s for s in schemas if s['name'] not in INTERNAL_SCHEMAS]

    # TODO_FOR_BETA: join exploration count from internal DB here after we've
    # refactored the models so that each exploration is associated with a schema
    # (by oid) in a specific database.
    return [{**s, "exploration_count": 0} for s in user_defined_schemas]
