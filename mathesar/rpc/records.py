"""
Classes and functions exposed to the RPC endpoint for managing table records.
"""

from typing import Any, Literal, Optional, TypedDict, Union

from modernrpc.core import REQUEST_KEY

from db.records import (
    list_records_from_table,
    get_record_from_table,
    search_records_from_table,
    delete_records_from_table,
    add_record_to_table,
    patch_record_in_table,
    list_by_record_summaries,
)
from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.rpc.utils import connect
from mathesar.utils.columns import get_download_link_columns
from mathesar.utils.tables import get_table_record_summary_templates
from mathesar.utils.download_links import get_download_links
from mathesar.utils.user_display import (
    get_user_columns_for_table,
    get_user_display_values_for_column,
    get_last_edited_by_columns_for_table,
)


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
    defined in `mathesar/db/sql/05_msar.sql`.

    Attributes:
      type: a function or operator to be used in filtering.
      args: The ordered arguments for the function or operator.
    """

    type: str
    args: list[Union["Filter", FilterAttnum, FilterLiteral]]


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
        preproc: The preprocessing functions to apply (if any).
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
        result_indices: The 0-indexed positions of group members in the
            results array.
    """

    id: int
    count: int
    results_eq: list[dict]
    result_indices: list[int]


class GroupingResponse(TypedDict):
    """
    Grouping response object. Extends Grouping with actual groups.

    Attributes:
        columns: The columns to be grouped by.
        preproc: The preprocessing functions to apply (if any).
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
        linked_record_smmaries: Information for previewing foreign key
            values, provides a map of foreign key to a text summary.
        record_summaries: Information for previewing returned records.
        download_links: Information for viewing or downloading file
            attachments.
    """

    count: int
    results: list[dict]
    grouping: GroupingResponse
    linked_record_summaries: dict[str, dict[str, str]]
    record_summaries: dict[str, str]
    download_links: Optional[dict]

    @classmethod
    def from_dict(cls, d):
        return cls(
            count=d["count"],
            results=d["results"],
            grouping=d.get("grouping"),
            linked_record_summaries=d.get("linked_record_summaries"),
            record_summaries=d.get("record_summaries"),
            download_links=d.get("download_links") or None,
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
        linked_record_summaries: Information for previewing foreign key
            values, provides a map of foreign key to a text summary.
        record_summaries: Information for previewing an added record.
    """

    results: list[dict]
    linked_record_summaries: dict[str, dict[str, str]]
    record_summaries: dict[str, str]

    @classmethod
    def from_dict(cls, d):
        return cls(
            results=d["results"],
            linked_record_summaries=d.get("linked_record_summaries"),
            record_summaries=d.get("record_summaries"),
        )


def _set_last_edited_by_columns(
    record_def: dict,
    table_oid: int,
    database_id: int,
    user_id: int,
) -> None:
    """
    Automatically set user_last_edited_by columns to the current user ID.

    This function modifies record_def in place to set any columns with
    user_last_edited_by=True to the current user's ID.

    Args:
        record_def: The record definition dict (modified in place)
        table_oid: The OID of the table
        database_id: The Django database ID
        user_id: The ID of the current user
    """
    last_edited_by_columns = get_last_edited_by_columns_for_table(
        table_oid, database_id
    )
    for column_attnum in last_edited_by_columns:
        # Set the column to the current user ID (ensure it's a string key)
        record_def[str(column_attnum)] = user_id


def _add_user_display_values_to_record_info(
    record_info: dict,
    table_oid: int,
    database_id: int,
) -> None:
    """
    Add user display values to the linked_record_summaries in record_info.

    This function:
    1. Detects user columns in the table
    2. Extracts user IDs from the record results
    3. Fetches user display values from Django User model
    4. Adds them to linked_record_summaries structure

    Args:
        record_info: The record info dict (modified in place)
        table_oid: The OID of the table
        database_id: The Django database ID
    """
    user_column_attnums = get_user_columns_for_table(table_oid, database_id)

    if not user_column_attnums:
        return

    # Ensure linked_record_summaries exists and is a dict
    if (
        "linked_record_summaries" not in record_info
        or record_info["linked_record_summaries"] is None
    ):
        record_info["linked_record_summaries"] = {}

    # Extract user IDs from results
    results = record_info.get("results", [])

    for column_attnum in user_column_attnums:
        # Collect all unique user IDs from this column
        user_ids = set()
        for record in results:
            # Column values are keyed by attnum as string or integer
            user_id = record.get(str(column_attnum)) or record.get(column_attnum)
            if user_id is not None:
                try:
                    # Convert to int if needed
                    user_ids.add(
                        int(user_id) if not isinstance(user_id, int) else user_id
                    )
                except (ValueError, TypeError):
                    # Skip invalid values
                    continue

        if not user_ids:
            continue

        # Get user display values
        user_display_values = get_user_display_values_for_column(
            table_oid, database_id, column_attnum, user_ids
        )

        if user_display_values:
            # Add to linked_record_summaries using column attnum as key
            record_info["linked_record_summaries"][
                str(column_attnum)
            ] = user_display_values


class SummarizedRecordReference(TypedDict):
    """
    A summarized reference to a record, typically used in foreign key fields.

    Attributes:
        key: A unique identifier for the record.
        summary: The record summary
    """

    key: Any
    summary: str


class RecordSummaryList(TypedDict):
    """
    Response for listing record summaries.

    Attributes:
        count: The total number of records matching the criteria.
        results: A list of summarized record references, each containing a key and a summary.
    """

    count: int
    results: list[SummarizedRecordReference]

    @classmethod
    def from_dict(cls, d):
        return cls(
            count=d["count"],
            results=d["results"],
        )


@mathesar_rpc_method(name="records.list", auth="login")
def list_(
    *,
    table_oid: int,
    database_id: int,
    limit: int = None,
    offset: int = None,
    order: list[OrderBy] = None,
    filter: Filter = None,
    grouping: Grouping = None,
    return_record_summaries: bool = False,
    **kwargs,
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
        return_record_summaries: Whether to return summaries of retrieved
            records.

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
            group=grouping,
            return_record_summaries=return_record_summaries,
            table_record_summary_templates=get_table_record_summary_templates(
                database_id
            ),
        )
    download_link_columns = get_download_link_columns(table_oid, database_id)
    record_info["download_links"] = (
        get_download_links(
            kwargs.get(REQUEST_KEY),
            record_info["results"],
            download_link_columns,
        )
        or None
    )

    _add_user_display_values_to_record_info(record_info, table_oid, database_id)

    return RecordList.from_dict(record_info)


@mathesar_rpc_method(name="records.get", auth="login")
def get(
    *,
    record_id: Any,
    table_oid: int,
    database_id: int,
    return_record_summaries: bool = False,
    table_record_summary_templates: dict[str, Any] = None,
    **kwargs,
) -> RecordList:
    """
    Get single record from a table by its primary key.

    Args:
        record_id: The primary key value of the record to be gotten.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
        return_record_summaries: Whether to return summaries of the
            retrieved record.
        table_record_summary_templates: A dict of record summary templates.
            If none are provided, then the templates will be take from the
            Django metadata. Any templates provided will take precedence on a
            per-table basis over the stored metadata templates. The purpose of
            this function parameter is to allow clients to generate record
            summary previews without persisting any metadata.
    Returns:
        The requested record, along with some metadata.
    """

    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = get_record_from_table(
            conn,
            record_id,
            table_oid,
            return_record_summaries=return_record_summaries,
            table_record_summary_templates={
                **get_table_record_summary_templates(database_id),
                **(table_record_summary_templates or {}),
            },
        )
    download_link_columns = get_download_link_columns(table_oid, database_id)
    record_info["download_links"] = (
        get_download_links(
            kwargs.get(REQUEST_KEY),
            record_info["results"],
            download_link_columns,
        )
        or None
    )

    _add_user_display_values_to_record_info(record_info, table_oid, database_id)

    return RecordList.from_dict(record_info)


@mathesar_rpc_method(name="records.add", auth="login")
def add(
    *,
    record_def: dict,
    table_oid: int,
    database_id: int,
    return_record_summaries: bool = False,
    **kwargs,
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
        return_record_summaries: Whether to return summaries of the added
            record.

    Returns:
        The created record, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    # Automatically set user_last_edited_by columns to current user ID
    _set_last_edited_by_columns(record_def, table_oid, database_id, user.id)
    with connect(database_id, user) as conn:
        record_info = add_record_to_table(
            conn,
            record_def,
            table_oid,
            return_record_summaries=return_record_summaries,
            table_record_summary_templates=get_table_record_summary_templates(
                database_id
            ),
        )

    _add_user_display_values_to_record_info(record_info, table_oid, database_id)

    return RecordAdded.from_dict(record_info)


@mathesar_rpc_method(name="records.patch", auth="login")
def patch(
    *,
    record_def: dict,
    record_id: Any,
    table_oid: int,
    database_id: int,
    return_record_summaries: bool = False,
    **kwargs,
) -> RecordAdded:
    """
    Modify a record in a table.

    The form of the `record_def` is determined by the underlying table.
    Keys should be attnums, and values should be the desired value for
    that column in the modified record. Explicit `null` values will set
    null for that value (with obvious exceptions where that would violate
    some constraint).

    Args:
        record_def: An object representing the record to be added.
        record_id: The primary key value of the record to modify.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
        return_record_summaries: Whether to return summaries of the
            modified record.

    Returns:
        The modified record, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    # Automatically set user_last_edited_by columns to current user ID
    _set_last_edited_by_columns(record_def, table_oid, database_id, user.id)
    with connect(database_id, user) as conn:
        record_info = patch_record_in_table(
            conn,
            record_def,
            record_id,
            table_oid,
            return_record_summaries=return_record_summaries,
            table_record_summary_templates=get_table_record_summary_templates(
                database_id
            ),
        )

    _add_user_display_values_to_record_info(record_info, table_oid, database_id)

    return RecordAdded.from_dict(record_info)


@mathesar_rpc_method(name="records.delete", auth="login")
def delete(
    *, record_ids: list[Any], table_oid: int, database_id: int, **kwargs
) -> list[Any]:
    """
    Delete records from a table by primary key.

    Args:
        record_ids: The primary key values of the records to be deleted.
        table_oid: The identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The primary key values of the records deleted.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        num_deleted = delete_records_from_table(
            conn,
            record_ids,
            table_oid,
        )
    return num_deleted


@mathesar_rpc_method(name="records.search", auth="login")
def search(
    *,
    table_oid: int,
    database_id: int,
    search_params: list[SearchParam] = [],
    limit: int = 10,
    offset: int = 0,
    return_record_summaries: bool = False,
    **kwargs,
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
        offset: The number of rows to skip before returning records from
            following rows.
        return_record_summaries: Whether to return summaries of retrieved
            records.

    Returns:
        The requested records, along with some metadata.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = search_records_from_table(
            conn,
            table_oid,
            search=search_params,
            limit=limit,
            offset=offset,
            return_record_summaries=return_record_summaries,
            table_record_summary_templates=get_table_record_summary_templates(
                database_id
            ),
        )
    download_link_columns = get_download_link_columns(table_oid, database_id)
    record_info["download_links"] = (
        get_download_links(
            kwargs.get(REQUEST_KEY),
            record_info["results"],
            download_link_columns,
        )
        or None
    )

    _add_user_display_values_to_record_info(record_info, table_oid, database_id)

    return RecordList.from_dict(record_info)


@mathesar_rpc_method(name="records.list_summaries", auth="login")
def list_summaries(
    *,
    table_oid: int,
    database_id: int,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
    **kwargs,
) -> RecordSummaryList:
    """
    List record summaries and keys for each record. Primarily used for selection via the Row seeker.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
        limit: Optional limit on the number of records to return.
        offset: Optional offset for pagination.
        search: Optional search term to filter records.

    Returns:
        A list of objects, each containing a record summary and key pertaining to a record.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        record_info = list_by_record_summaries(
            conn,
            table_oid,
            limit=limit,
            offset=offset,
            search=search,
            table_record_summary_templates=get_table_record_summary_templates(
                database_id
            ),
        )
    return RecordSummaryList.from_dict(record_info)
