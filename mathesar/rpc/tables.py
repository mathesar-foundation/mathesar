from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.tables.operations.select import get_table_info, get_table
from db.tables.operations.drop import drop_table_from_database
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class TableInfo(TypedDict):
    """
    Information about a table.

    Attributes:
        oid: The `oid` of the table in the schema.
        name: The name of the table.
        schema: The `oid` of the schema where the table lives.
        description: The description of the table.
    """
    oid: int
    name: str
    schema: int
    description: Optional[str]


@rpc_method(name="tables.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, schema_oid: int, database_id: int, **kwargs) -> list[TableInfo]:
    """
    List information about tables for a schema. Exposed as `list`.

    Args:
        schema_oid: Identity of the schema in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of table details.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_table_info = get_table_info(schema_oid, conn)
    return [
        TableInfo(tab) for tab in raw_table_info
    ]


@rpc_method(name="tables.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def get_(*, table_oid: int, database_id: int, **kwargs) -> TableInfo:
    """
    List information about a table for a schema. Exposed as `get_`.

    Args:
        schema_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        Table details for a given table oid.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_table_info = get_table(table_oid, conn)
    return TableInfo(raw_table_info)


@rpc_method(name="tables.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(
    *, table_oid: int, database_id: int, cascade: bool = False, **kwargs
) -> str:
    """
    Delete a table from a schema.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
        cascade: Whether to drop the dependent objects.

    Returns:
        The name of the dropped table.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return drop_table_from_database(table_oid, conn, cascade)
