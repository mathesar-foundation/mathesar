"""
Classes and functions exposed to the RPC endpoint for managing table columns.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.columns.operations.select import get_column_info_for_table
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from mathesar.utils.columns import get_display_options


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
        if type_options is not None:
            # All keys are optional, but we want to validate the keys
            # we actually return.
            all_keys = dict(
                precision=type_options.get("precision"),
                scale=type_options.get("scale"),
                fields=type_options.get("fields"),
                length=type_options.get("length"),
                item_type=type_options.get("item_type"),
            )
            return cls(**{k: v for k, v in all_keys.items() if v is not None})


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


class ColumnInfo(TypedDict):
    """
    Information about a column.

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
            description=col_info.get("description")
        )


@rpc_method(name="columns.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list(*, table_oid: int, database_id: int, **kwargs):
    """
    List columns for a table, with information about each.

    Also return display options for each column, if they're defined.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django model id of the database containing the table.

    Returns:
        A list of column details, and a separate list of display options.
    """
    request = kwargs.get(REQUEST_KEY)
    with connect(database_id, request.user) as conn:
        column_info = [
            ColumnInfo.from_dict(col)
            for col in get_column_info_for_table(table_oid, conn)
        ]
    if request.user.metadata_privileges(database_id) is not None:
        attnums = [col['id'] for col in column_info]
        display_options = get_display_options(table_oid, attnums)
    else:
        display_options = None
    return {
        "column_info": column_info,
        "display_options": display_options
    }
