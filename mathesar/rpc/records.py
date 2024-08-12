"""
Classes and functions exposed to the RPC endpoint for managing table records.
"""
from typing import Any, Literal, Optional, TypedDict, Union

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.records.operations import delete as record_delete
from db.records.operations import insert as record_insert
from db.records.operations import select as record_select
from db.records.operations import update as record_update
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


class Grouping(TypedDict):
    """
    Grouping definition.

    The table involved must have a single column primary key.

    Attributes:
        columns: The columns to be grouped by.
        preproc: The preprocessing funtions to apply (if any).
    """
    columns: list[int]
    preproc: list[str]


class Group(TypedDict):
    """
    Group definition.

    Note that the `count` is over all rows in the group, whether returned
    or not. However, `result_indices` is restricted to only the rows
    returned. This is to avoid potential problems if there are many rows
    in the group (e.g., the whole table), but we only return a few.

    Attributes:
        id: The id of the group. Consistent for same input.
        count: The number of items in the group.
        results_eq: The value the results of the group equal.
        result_indices: The primary key values of group members.
    """
    id: int
    count: int
    results_eq: list[dict]
    result_indices: list[Any]


class GroupingResponse(TypedDict):
    """
    Grouping response object. Extends Grouping with actual groups.

    Attributes:
        columns: The columns to be grouped by.
        preproc: The preprocessing funtions to apply (if any).
        groups: The groups applicable to the records being returned.
    """
    columns: list[int]
    preproc: list[str]
    groups: list[Group]


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
        grouping: Information for displaying grouped records.
        preview_data: Information for previewing foreign key values.
    """
    count: int
    results: list[dict]
    grouping: GroupingResponse
    preview_data: list[dict]

    @classmethod
    def from_dict(cls, d):
        return cls(
            count=d["count"],
            results=d["results"],
            grouping=d.get("grouping"),
            preview_data=[],
            query=d["query"],
        )


class RecordAdded(TypedDict):
    """
    Record from a table, along with some meta data

    The form of the object in the `results` array is determined by the
    underlying records being listed. The keys of each object are the
    attnums of the retrieved columns. The values are the value for the
    given row, for the given column.

    Attributes:
        results: An array of a single record objects (the one added).
        preview_data: Information for previewing foreign key values.
    """
    count: int
    results: list[dict]
    grouping: GroupingResponse
    preview_data: list[dict]

    @classmethod
    def from_dict(cls, d):
        return cls(
            results=d["results"],
            preview_data=[],
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
        grouping: Grouping = None,
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
        grouping: An array of group definition objects.

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
            group=grouping,
        )
    return RecordList.from_dict(record_info)


@rpc_method(name="records.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def get(
        *,
        record_id: Any,
        table_oid: int,
        database_id: int,
        **kwargs
) -> RecordList:
    """
    Get single record from a table by its primary key.

    Args:
        record_id: The primary key value of the record to be gotten.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The requested record, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = record_select.get_record_from_table(
            conn,
            record_id,
            table_oid,
        )
    return RecordList.from_dict(record_info)


@rpc_method(name="records.add")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add(
        *,
        record_def: dict,
        table_oid: int,
        database_id: int,
        **kwargs
) -> RecordAdded:
    """
    Add a single record to a table.

    The form of the `record_def` is determined by the underlying table.
    Keys should be attnums, and values should be the desired value for
    that column in the created record. Missing keys will use default
    values (if set on the DB), and explicit `null` values will set null
    for that value regardless of default (with obvious exceptions where
    that would violate some constraint)

    Args:
        record_def: An object representing the record to be added.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The created record, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = record_insert.add_record_to_table(
            conn,
            record_def,
            table_oid,
        )
    return RecordAdded.from_dict(record_info)


@rpc_method(name="records.patch")
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch(
        *,
        record_def: dict,
        record_id: Any,
        table_oid: int,
        database_id: int,
        **kwargs
) -> RecordAdded:
    """
    Modify a record in a table.

    The form of the `record_def` is determined by the underlying table.  Keys
    should be attnums, and values should be the desired value for that column in
    the modified record. Explicit `null` values will set null for that value
    (with obvious exceptions where that would violate some constraint).

    Args:
        record_def: An object representing the record to be added.
        record_id: The primary key value of the record to modify.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The modified record, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = record_update.patch_record_in_table(
            conn,
            record_def,
            record_id,
            table_oid,
        )
    return RecordAdded.from_dict(record_info)


@rpc_method(name="records.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(
        *,
        record_ids: list[Any],
        table_oid: int,
        database_id: int,
        **kwargs
) -> Optional[int]:
    """
    Delete records from a table by primary key.

    Args:
        record_ids: The primary key values of the records to be deleted.
        table_oid: The identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The number of records deleted.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        num_deleted = record_delete.delete_records_from_table(
            conn,
            record_ids,
            table_oid,
        )
    return num_deleted


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
