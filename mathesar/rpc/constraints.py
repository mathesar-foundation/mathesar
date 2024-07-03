"""
Classes and functions exposed to the RPC endpoint for managing table constraints.
"""
from typing import *

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.constraints.operations.select import get_constraints_for_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect

class CreatableConstraintInfo(TypedDict):
    name: Optional[str]
    # TODO


class Constraint(TypedDict):
    """
    Information about a constraint

    Attributes:
        oid: The OID of the schema
        name: The name of the schema
        description: A description of the schema
        table_count: The number of tables in the schema
    """
    oid: int
    table_oid: int
    # TODO


@rpc_method(name="constraints.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[Constraint]:
    """
    List information about constraints in a table. Exposed as `list`.

    Args:
        database_id: The Django id of the database containing the table.
        table_oid: The oid of the table to list constraints for.

    Returns:
        A list of Constraint objects
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return get_constraints_for_table(table_oid, conn)
