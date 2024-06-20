"""
Classes and functions exposed to the RPC endpoint for managing column metadata.
"""
from typing import Literal, Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.columns import get_columns_meta_data


class ColumnMetaData(TypedDict):
    database: int
    table_oid: int
    attnum: int
    bool_input: Optional[Literal["dropdown", "checkbox"]]
    bool_true: Optional[str]
    bool_false: Optional[str]
    num_min_frac_digits: Optional[int]
    num_max_frac_digits: Optional[int]
    num_show_as_perc: Optional[bool]
    mon_currency_symbol: Optional[str]
    mon_currency_location: Optional[Literal["after-minus", "end-with-space"]]
    time_format: Optional[str]
    date_format: Optional[str]
    duration_min: Optional[str]
    duration_max: Optional[str]
    duration_show_units: Optional[bool]

    @classmethod
    def from_db_model(cls, db_model):
        return cls(
            database=db_model.database.id,
            table_oid=db_model.table_oid,
            attnum=db_model.attnum,
            bool_input=db_model.bool_input,
            bool_true=db_model.bool_true,
            bool_false=db_model.bool_false,
            num_min_frac_digits=db_model.num_min_frac_digits,
            num_max_frac_digits=db_model.num_max_frac_digits,
            num_show_as_perc=db_model.num_show_as_perc,
            mon_currency_symbol=db_model.mon_currency_symbol,
            mon_currency_location=db_model.mon_currency_location,
            time_format=db_model.time_format,
            date_format=db_model.date_format,
            duration_min=db_model.duration_min,
            duration_max=db_model.duration_max,
            duration_show_units=db_model.duration_show_units,
        )


@rpc_method(name="columns.metadata.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, table_oid: int, database_id: int, **kwargs) -> list[ColumnMetaData]:
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
        ColumnMetaData.from_db_model(db_model) for db_model in columns_meta_data
    ]
