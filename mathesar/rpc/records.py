"""
Classes and functions exposed to the RPC endpoint for managing table records.
"""
from typing import TypedDict, Literal

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.records.operations.select import list_records_from_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class OrderBy(TypedDict):
    """
    An object defining an `ORDER BY` clause.

    Attributes:
        attnum: The attnum of the column to order by.
        direction: The direction to order by.
    """
    attnum: int
    direction: Literal["asc", "desc"]


class RecordList(TypedDict):
    """
    Records from a table, along with some meta data

    The form of the objects in the `results` array is determined by the
    underlying records being listed. The keys of each object are the
    attnums of the retrieved columns. The values are the value for the
    given row, for the given column.

    Attributes:
        count: The total number of records in the table.
        results: An array of record objects.
        group: Information for displaying the records grouped in some way.
        preview_data: Information for previewing foreign key values.
    """
    count: int
    results: list[dict]
    group: dict
    preview_data: list[dict]

    @classmethod
    def from_dict(cls, d):
        return cls(
            count=d["count"],
            results=d["results"],
            group=None,
            preview_data=[],
            query=d["query"],
        )


@rpc_method(name="records.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(
        *,
        table_oid: int,
        database_id: int,
        limit: int = None,
        offset: int = None,
        order: list[OrderBy] = None,
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
        limit: The maximum number of rows we'll return.
        offset: The number of rows to skip before returning records from
                 following rows.
        order: An array of ordering definition objects.
        filter: An array of filter definition objects.
        group: An array of group definition objects.
        search: An array of search definition objects.

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
    return RecordList.from_dict(record_info)
