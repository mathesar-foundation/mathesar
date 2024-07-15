"""
Classes and functions exposed to the RPC endpoint for managing table records.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.records.operations.select import list_records_from_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class RecordListReturn(TypedDict):
    """
    Records from a table, along with some meta data

    The form of the objects in the `results` array is determined by the
    underlying records being listed. The keys of each object are the
    attnums of the retrieved columns. The values are the value for the
    given row, for the given column. The general form is:

    [
        {"<attnum1>": <val1,1>, "<attnum2>": <val1,2>, "<attnum3>": <val1,3>, ...},
        {"<attnum1>": <val2,1>, "<attnum2>": <val2,2>, "<attnum3>": <val2,3>, ...},
        {"<attnum1>": <val3,1>, "<attnum2>": <val3,2>, "<attnum3>": <val3,3>, ...},
        ...
    ]

    Attributes:
        count: The total number of records in the table.
        results: An array of record objects.
    """
    count: int
    results: list[dict]

    @classmethod
    def from_dict(cls, d):
        return cls(count=d["count"], results=d["results"])


@rpc_method(name="records.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(
        *,
        table_oid: int,
        database_id: int,
        limit: int = None,
        offset: int = None,
        order: list[dict] = None,
        filter: list[dict] = None,
        group: list[dict] = None,
        search: list[dict] = None,
        **kwargs
) -> dict:
    """
    List records from a table, and its row count. Exposed as `list`.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The requested records, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = list_records_from_table(
            conn,
            table_oid,
            limit=limit,
            offset=offset,
            order=order,
            filter=filter,
            group=group,
            search=search,
        )
    return RecordListReturn.from_dict(record_info)
