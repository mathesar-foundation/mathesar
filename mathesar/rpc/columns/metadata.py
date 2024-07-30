"""
Classes and functions exposed to the RPC endpoint for managing column metadata.
"""
from typing import Literal, Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.columns import get_columns_meta_data, set_columns_meta_data


class ColumnMetaDataRecord(TypedDict):
    """
    Metadata for a column in a table.

    Only the `database`, `table_oid`, and `attnum` keys are required.

    Attributes:
        database_id: The Django id of the database containing the table.
        table_oid: The OID of the table containing the column.
        attnum: The attnum of the column in the table.
        bool_input: How the input for a boolean column should be shown.
        bool_true: A string to display for `true` values.
        bool_false: A string to display for `false` values.
        num_min_frac_digits: Minimum digits shown after the decimal point.
        num_max_frac_digits: Maximum digits shown after the decimal point.
        num_grouping:
        num_format:
        mon_currency_symbol: The currency symbol shown for money value.
        mon_currency_location: Where the currency symbol should be shown.
        time_format: A string representing the format of time values.
        date_format: A string representing the format of date values.
        duration_min: The smallest unit for displaying durations.
        duration_max: The largest unit for displaying durations.
    """
    database_id: int
    table_oid: int
    attnum: int
    bool_input: Optional[Literal["dropdown", "checkbox"]]
    bool_true: Optional[str]
    bool_false: Optional[str]
    num_min_frac_digits: Optional[int]
    num_max_frac_digits: Optional[int]
    num_grouping: Optional[bool]
    num_format: Optional[bool]
    mon_currency_symbol: Optional[str]
    mon_currency_location: Optional[Literal["after-minus", "end-with-space"]]
    time_format: Optional[str]
    date_format: Optional[str]
    duration_min: Optional[str]
    duration_max: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            database_id=model.database.id,
            table_oid=model.table_oid,
            attnum=model.attnum,
            bool_input=model.bool_input,
            bool_true=model.bool_true,
            bool_false=model.bool_false,
            num_min_frac_digits=model.num_min_frac_digits,
            num_max_frac_digits=model.num_max_frac_digits,
            num_grouping=model.num_grouping,
            num_format=model.num_format,
            mon_currency_symbol=model.mon_currency_symbol,
            mon_currency_location=model.mon_currency_location,
            time_format=model.time_format,
            date_format=model.date_format,
            duration_min=model.duration_min,
            duration_max=model.duration_max,
        )


class ColumnMetaDataBlob(TypedDict):
    """
    The metadata fields which can be set for a column in a table.

    Attributes:
        attnum: The attnum of the column in the table.
        bool_input: How the input for a boolean column should be shown.
        bool_true: A string to display for `true` values.
        bool_false: A string to display for `false` values.
        num_min_frac_digits: Minimum digits shown after the decimal point.
        num_max_frac_digits: Maximum digits shown after the decimal point.
        num_grouping:
        num_format:
        mon_currency_symbol: The currency symbol shown for money value.
        mon_currency_location: Where the currency symbol should be shown.
        time_format: A string representing the format of time values.
        date_format: A string representing the format of date values.
        duration_min: The smallest unit for displaying durations.
        duration_max: The largest unit for displaying durations.
    """
    attnum: int
    bool_input: Optional[Literal["dropdown", "checkbox"]]
    bool_true: Optional[str]
    bool_false: Optional[str]
    num_min_frac_digits: Optional[int]
    num_max_frac_digits: Optional[int]
    num_grouping: Optional[str]
    num_format: Optional[str]
    mon_currency_symbol: Optional[str]
    mon_currency_location: Optional[Literal["after-minus", "end-with-space"]]
    time_format: Optional[str]
    date_format: Optional[str]
    duration_min: Optional[str]
    duration_max: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            attnum=model.attnum,
            bool_input=model.bool_input,
            bool_true=model.bool_true,
            bool_false=model.bool_false,
            num_min_frac_digits=model.num_min_frac_digits,
            num_max_frac_digits=model.num_max_frac_digits,
            num_grouping=model.num_grouping,
            num_format=model.num_format,
            mon_currency_symbol=model.mon_currency_symbol,
            mon_currency_location=model.mon_currency_location,
            time_format=model.time_format,
            date_format=model.date_format,
            duration_min=model.duration_min,
            duration_max=model.duration_max,
        )


@rpc_method(name="columns.metadata.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[ColumnMetaDataRecord]:
    """
    List metadata associated with columns for a table. Exposed as `list`.

    Args:
        table_oid: Identity of the table in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        A list of column meta data objects.
    """
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    return [
        ColumnMetaDataRecord.from_model(model) for model in columns_meta_data
    ]


@rpc_method(name="columns.metadata.set")
@http_basic_auth_login_required
@handle_rpc_exceptions
def set_(
    *,
    column_meta_data_list: list[ColumnMetaDataBlob],
    table_oid: int,
    database_id: int,
    **kwargs
) -> None:
    """
    Set metadata associated with columns of a table for a database. Exposed as `set`.

    Args:
        column_meta_data_list: A list describing desired metadata alterations.
        table_oid: Identity of the table whose metadata we'll modify.
        database_id: The Django id of the database containing the table.
    """
    set_columns_meta_data(
        column_meta_data_list, table_oid, database_id
    )
