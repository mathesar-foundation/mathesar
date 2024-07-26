"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.columns.operations.alter import alter_columns_in_table
from db.columns.operations.create import add_columns_to_table
from db.columns.operations.drop import drop_columns_from_table
from db.columns.operations.select import get_column_info_for_table
from mathesar.rpc.columns.metadata import ColumnMetaDataBlob
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from mathesar.utils.columns import get_columns_meta_data


class TypeOptions(TypedDict, total=False):
    """
    Options applied to a type. All attributes are optional.

    Take special care with the difference between numeric and date/time
    types w.r.t. precision. The attribute has a different meaning
    depending on the type to which it's being applied.

    Attributes:
        precision: For numeric types, the number of significant digits.
                   For date/time types, the number of fractional digits.
        scale: For numeric types, the number of fractional digits.
        fields: Which time fields are stored. See Postgres docs.
        length: The maximum length of a character-type field.
        item_type: The member type for arrays.
    """
    precision: int
    scale: int
    fields: str
    length: int
    item_type: str

    @classmethod
    def from_dict(cls, type_options):
        if type_options is None:
            return
        # All keys are optional, but we want to validate the keys we
        # actually return.
        all_keys = dict(
            precision=type_options.get("precision"),
            scale=type_options.get("scale"),
            fields=type_options.get("fields"),
            length=type_options.get("length"),
            item_type=type_options.get("item_type"),
        )
        reduced_keys = {k: v for k, v in all_keys.items() if v is not None}
        if reduced_keys != {}:
            return cls(**reduced_keys)


class ColumnDefault(TypedDict):
    """
    A dictionary describing the default value for a column.

    Attributes:
        value: An SQL expression giving the default value.
        is_dynamic: Whether the `value` is possibly dynamic.
    """
    value: str
    is_dynamic: bool

    @classmethod
    def from_dict(cls, col_default):
        if col_default is not None:
            return cls(
                value=col_default["value"],
                is_dynamic=col_default["is_dynamic"],
            )


class CreatableColumnInfo(TypedDict):
    """
    Information needed to add a new column.

    No keys are required.

    Attributes:
        name: The name of the column.
        type: The type of the column on the database.
        type_options: The options applied to the column type.
        nullable: Whether or not the column is nullable.
        default: The default value.
        description: The description of the column.
    """
    name: Optional[str]
    type: Optional[str]
    type_options: Optional[TypeOptions]
    nullable: Optional[bool]
    default: Optional[ColumnDefault]
    description: Optional[str]


class SettableColumnInfo(TypedDict):
    """
    Information about a column, restricted to settable fields.

    When possible, Passing `null` for a key will clear the underlying
    setting. E.g.,

    - `default = null` clears the column default setting.
    - `type_options = null` clears the type options for the column.
    - `description = null` clears the column description.

    Setting any of `name`, `type`, or `nullable` is a noop.


    Only the `id` key is required.

    Attributes:
        id: The `attnum` of the column in the table.
        name: The name of the column.
        type: The type of the column on the database.
        type_options: The options applied to the column type.
        nullable: Whether or not the column is nullable.
        default: The default value.
        description: The description of the column.
    """
    id: int
    name: Optional[str]
    type: Optional[str]
    type_options: Optional[TypeOptions]
    nullable: Optional[bool]
    default: Optional[ColumnDefault]
    description: Optional[str]


class PreviewableColumnInfo(TypedDict):
    """
    Information needed to preview a column.

    Attributes:
        id: The `attnum` of the column in the table.
        type: The new type to be applied to a column.
        type_options: The options to be applied to the column type.
    """
    id: int
    type: Optional[str]
    type_options: Optional[TypeOptions]


class ColumnInfo(TypedDict):
    """
    Information about a column. Extends the settable fields.

    Attributes:
        id: The `attnum` of the column in the table.
        name: The name of the column.
        type: The type of the column on the database.
        type_options: The options applied to the column type.
        nullable: Whether or not the column is nullable.
        primary_key: Whether the column is in the primary key.
        default: The default value and whether it's dynamic.
        has_dependents: Whether the column has dependent objects.
        description: The description of the column.
        valid_target_types: A list of all types to which the column can
            be cast.
    """
    id: int
    name: str
    type: str
    type_options: TypeOptions
    nullable: bool
    primary_key: bool
    default: ColumnDefault
    has_dependents: bool
    description: str
    valid_target_types: list[str]

    @classmethod
    def from_dict(cls, col_info):
        return cls(
            id=col_info["id"],
            name=col_info["name"],
            type=col_info["type"],
            type_options=TypeOptions.from_dict(col_info.get("type_options")),
            nullable=col_info["nullable"],
            primary_key=col_info["primary_key"],
            default=ColumnDefault.from_dict(col_info.get("default")),
            has_dependents=col_info["has_dependents"],
            description=col_info.get("description"),
            valid_target_types=col_info.get("valid_target_types")
        )


@rpc_method(name="columns.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[ColumnInfo]:
    """
    List information about columns for a table. Exposed as `list`.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of column details.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        raw_column_info = get_column_info_for_table(table_oid, conn)
    return [ColumnInfo.from_dict(col) for col in raw_column_info]


@rpc_method(name="columns.add")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add(
        *,
        column_data_list: list[CreatableColumnInfo],
        table_oid: int,
        database_id: int,
        **kwargs
) -> list[int]:
    """
    Add columns to a table.

    There are defaults for both the name and type of a column, and so
    passing `[{}]` for `column_data_list` would add a single column of
    type `CHARACTER VARYING`, with an auto-generated name.

    Args:
        column_data_list: A list describing desired columns to add.
        table_oid: Identity of the table to which we'll add columns.
        database_id: The Django id of the database containing the table.

    Returns:
        An array of the attnums of the new columns.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return add_columns_to_table(table_oid, column_data_list, conn)


@rpc_method(name="columns.patch")
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch(
        *,
        column_data_list: list[SettableColumnInfo],
        table_oid: int,
        database_id: int,
        **kwargs
) -> int:
    """
    Alter details of preexisting columns in a table.

    Does not support altering the type or type options of array columns.

    Args:
        column_data_list: A list describing desired column alterations.
        table_oid: Identity of the table whose columns we'll modify.
        database_id: The Django id of the database containing the table.

    Returns:
        The number of columns altered.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return alter_columns_in_table(table_oid, column_data_list, conn)


@rpc_method(name="columns.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(
        *, column_attnums: list[int], table_oid: int, database_id: int, **kwargs
) -> int:
    """
    Delete columns from a table.

    Args:
        column_attnums: A list of attnums of columns to delete.
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        The number of columns dropped.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return drop_columns_from_table(table_oid, column_attnums, conn)


@rpc_method(name="columns.list_with_metadata")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_with_metadata(*, table_oid: int, database_id: int, **kwargs) -> list:
    """
    List information about columns for a table, along with the metadata associated with each column.
    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.
    Returns:
        A list of column details.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        column_info = get_column_info_for_table(table_oid, conn)
    column_metadata = get_columns_meta_data(table_oid, database_id)
    metadata_map = {
        c.attnum: ColumnMetaDataBlob.from_model(c) for c in column_metadata
    }
    return [col | {"metadata": metadata_map.get(col["id"])} for col in column_info]
