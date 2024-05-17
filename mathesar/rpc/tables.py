from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.tables.operations.select import get_table_info
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class TableInfo(TypedDict):
    id: int
    name: str
    schema: str
    description: str


class TableListReturn(TypedDict):
    table_info: list[TableInfo]


@rpc_method(name="tables.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> TableListReturn:
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_table_info = get_table_info(conn)
    table_info = [
        TableInfo.from_dict(tab) for tab in raw_table_info
    ]
    return TableListReturn(
        table_info=table_info
    )
