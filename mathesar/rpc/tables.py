from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.tables.operations.select import get_table_info
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class TableInfo(TypedDict):
    """
    Information about a table.

    Attributes:
        id: The `oid` of the table in the schema.
        name: The name of the table.
        schema: The `oid` of the schema where the table lives.
        description: The description of the table.
    """
    id: int
    name: str
    schema: int
    description: str


class TableListReturn(TypedDict):
    """
    Information about the tables of a schema.

    Attributes:
        table_info: Column information from the user's database.
    """
    table_info: list[TableInfo]


@rpc_method(name="tables.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, schema_oid: int, database_id: int, **kwargs) -> TableListReturn:
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
    table_info = [
        TableInfo(tab) for tab in raw_table_info
    ]
    return TableListReturn(
        table_info=table_info
    )
