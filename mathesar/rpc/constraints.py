"""
Classes and functions exposed to the RPC endpoint for managing table constraints.
"""
from typing import Optional, TypedDict

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
        oid: The OID of the constraint.
        name: The name of the constraint.
        type: The type of the constraint.
        columns: List of constrained columns.
        referent_table_oid: The OID of the referent table.
        referent_columns: List of referent column(s).
    """
    oid: int
    table_oid: int
    type: str
    columns: list[int]
    referent_table_oid: Optional[int]
    referent_columns: Optional[list[int]]


@rpc_method(name="constraints.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[Constraint]:
    """
    List information about constraints in a table. Exposed as `list`.

    Args:
        table_oid: The oid of the table to list constraints for.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of Constraint objects
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return get_constraints_for_table(table_oid, conn)
