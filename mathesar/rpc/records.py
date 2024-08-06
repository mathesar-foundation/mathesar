"""
Classes and functions exposed to the RPC endpoint for managing table records.
"""
from typing import Any, Literal, TypedDict, Union

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.records.operations import select as record_select
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


class FilterAttnum(TypedDict):
    """
    An object choosing a column for a filter.

    Attributes:
        type: Must be `"attnum"`
        value: The attnum of the column to filter by
    """
    type: Literal["attnum"]
    value: int


class FilterLiteral(TypedDict):
    """
    An object defining a literal for an argument to a filter.

    Attributes:
      type: must be `"literal"`.
      value: The value of the literal.
    """
    type: Literal["literal"]
    value: Any


class Filter(TypedDict):
    """
    An object defining a filter to be used in a `WHERE` clause.

    For valid `type` values, see the `msar.filter_templates` table
    defined in `mathesar/db/sql/00_msar.sql`.

    Attributes:
      type: a function or operator to be used in filtering.
      args: The ordered arguments for the function or operator.
    """
    type: str
    args: list[Union['Filter', FilterAttnum, FilterLiteral]]


class SearchParam(TypedDict):
    """
    Search definition for a single column.

    Attributes:
        attnum: The attnum of the column in the table.
        literal: The literal to search for in the column.
    """
    attnum: int
    literal: Any


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
        filter: Filter = None,
        group: list[dict] = None,
        **kwargs
) -> RecordList:
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

    Returns:
        The requested records, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = record_select.list_records_from_table(
            conn,
            table_oid,
            limit=limit,
            offset=offset,
            order=order,
            filter=filter,
            group=group,
        )
    return RecordList.from_dict(record_info)


@rpc_method(name="records.search")
@http_basic_auth_login_required
@handle_rpc_exceptions
def search(
        *,
        table_oid: int,
        database_id: int,
        search_params: list[SearchParam] = [],
        limit: int = 10,
        **kwargs
) -> RecordList:
    """
    List records from a table according to `search_params`.


    Literals will be searched for in a basic way in string-like columns,
    but will have to match exactly in non-string-like columns.

    Records are assigned a score based on how many matches, and of what
    quality, they have with the passed search parameters.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
        search_params: Results are ranked and filtered according to the
                       objects passed here.
        limit: The maximum number of rows we'll return.

    Returns:
        The requested records, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = record_select.search_records_from_table(
            conn,
            table_oid,
            search=search_params,
            limit=limit,
        )
    return RecordList.from_dict(record_info)
