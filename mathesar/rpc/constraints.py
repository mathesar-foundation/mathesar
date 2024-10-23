"""
Classes and functions exposed to the RPC endpoint for managing table constraints.
"""
from typing import Optional, TypedDict, Union

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.constraints import(
    get_constraints_for_table,
    create_constraint,
    drop_constraint_via_oid,
)
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class ForeignKeyConstraint(TypedDict):
    """
    Information about a foreign key constraint.

    Attributes:
        type: The type of the constraint(`'f'` for foreign key constraint).
        columns: List of columns to set a foreign key on.
        fkey_relation_id: The OID of the referent table.
        fkey_columns: List of referent column(s).
        name: The name of the constraint.
        deferrable: Whether to postpone constraint checking until the end of the transaction.
        fkey_update_action: Specifies what action should be taken when the referenced key is updated.
            Valid options include `'a'(no action)`(default behavior), `'r'(restrict)`, `'c'(cascade)`, `'n'(set null)`, `'d'(set default)`
        fkey_delete_action: Specifies what action should be taken when the referenced key is deleted.
            Valid options include `'a'(no action)`(default behavior), `'r'(restrict)`, `'c'(cascade)`, `'n'(set null)`, `'d'(set default)`
        fkey_match_type: Specifies how the foreign key matching should be performed.
            Valid options include `'f'(full match)`, `'s'(simple match)`(default behavior).
    """
    type: str = 'f'
    columns: list[int]
    fkey_relation_id: int
    fkey_columns: list[int]
    name: Optional[str]
    deferrable: Optional[bool]
    fkey_update_action: Optional[str]
    fkey_delete_action: Optional[str]
    fkey_match_type: Optional[str]


class PrimaryKeyConstraint(TypedDict):
    """
    Information about a primary key constraint.

    Attributes:
        type: The type of the constraint(`'p'` for primary key constraint).
        columns: List of columns to set a primary key on.
        name: The name of the constraint.
        deferrable: Whether to postpone constraint checking until the end of the transaction.
    """
    type: str = 'p'
    columns: list[int]
    name: Optional[str]
    deferrable: Optional[bool]


class UniqueConstraint(TypedDict):
    """
    Information about a unique constraint.

    Attributes:
        type: The type of the constraint(`'u'` for unique constraint).
        columns: List of columns to set a unique constraint on.
        name: The name of the constraint.
        deferrable: Whether to postpone constraint checking until the end of the transaction.
    """
    type: str = 'u'
    columns: list[int]
    name: Optional[str]
    deferrable: Optional[bool]


CreatableConstraintInfo = list[Union[ForeignKeyConstraint, PrimaryKeyConstraint, UniqueConstraint]]
"""
Type alias for a list of createable constraints which can be unique, primary key, or foreign key constraints.
"""


class ConstraintInfo(TypedDict):
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
    name: str
    type: str
    columns: list[int]
    referent_table_oid: Optional[int]
    referent_columns: Optional[list[int]]

    @classmethod
    def from_dict(cls, con_info):
        return cls(
            oid=con_info["oid"],
            name=con_info["name"],
            type=con_info["type"],
            columns=con_info["columns"],
            referent_table_oid=con_info["referent_table_oid"],
            referent_columns=con_info["referent_columns"]
        )


@rpc_method(name="constraints.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[ConstraintInfo]:
    """
    List information about constraints in a table. Exposed as `list`.

    Args:
        table_oid: The oid of the table to list constraints for.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of constraint details.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        con_info = get_constraints_for_table(table_oid, conn)
        return [ConstraintInfo.from_dict(con) for con in con_info]


@rpc_method(name="constraints.add")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add(
    *,
    table_oid: int,
    constraint_def_list: CreatableConstraintInfo,
    database_id: int, **kwargs
) -> list[int]:
    """
    Add constraint(s) on a table in bulk.

    Args:
        table_oid: Identity of the table to delete constraint for.
        constraint_def_list: A list describing the constraints to add.
        database_id: The Django id of the database containing the table.

    Returns:
        The oid(s) of all the constraints on the table.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return create_constraint(table_oid, constraint_def_list, conn)


@rpc_method(name="constraints.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(*, table_oid: int, constraint_oid: int, database_id: int, **kwargs) -> str:
    """
    Delete a constraint from a table.

    Args:
        table_oid: Identity of the table to delete constraint for.
        constraint_oid: The OID of the constraint to delete.
        database_id: The Django id of the database containing the table.

    Returns:
        The name of the dropped constraint.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return drop_constraint_via_oid(table_oid, constraint_oid, conn)
