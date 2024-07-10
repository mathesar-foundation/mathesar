"""
Classes and functions exposed to the RPC endpoint for managing table metadata.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.tables import get_tables_meta_data, patch_table_meta_data


class TableMetaData(TypedDict):
    """
    Metadata for a table in a database.

    Only the `database` and `table_oid` keys are required.

    Attributes:
        id: The Django id of the TableMetaData object.
        database_id: The Django id of the database containing the table.
        table_oid: The OID of the table in the database.
        import_verified: Specifies whether a file has been successfully imported into a table.
        column_order: The order in which columns of a table are displayed.
        record_summary_customized: Specifies whether the record summary has been customized.
        record_summary_template: Record summary template for a referent column.
    """
    id: int
    database_id: int
    table_oid: int
    import_verified: Optional[bool]
    column_order: Optional[list[int]]
    record_summary_customized: Optional[bool]
    record_summary_template: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            database_id=model.database.id,
            table_oid=model.table_oid,
            import_verified=model.import_verified,
            column_order=model.column_order,
            record_summary_customized=model.record_summary_customized,
            record_summary_template=model.record_summary_template,
        )


class SettableTableMetaData(TypedDict):
    """
    Settable metadata fields for a table in a database.

    Attributes:
        import_verified: Specifies whether a file has been successfully imported into a table.
        column_order: The order in which columns of a table are displayed.
        record_summary_customized: Specifies whether the record summary has been customized.
        record_summary_template: Record summary template for a referent column.
    """
    import_verified: Optional[bool]
    column_order: Optional[list[int]]
    record_summary_customized: Optional[bool]
    record_summary_template: Optional[str]


@rpc_method(name="tables.metadata.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[TableMetaData]:
    """
    List metadata associated with tables for a database.

    Args:
        database_id: The Django id of the database containing the table.

    Returns:
        Metadata object for a given table oid.
    """
    table_meta_data = get_tables_meta_data(database_id)
    return [
        TableMetaData.from_model(model) for model in table_meta_data
    ]


@rpc_method(name="tables.metadata.patch")
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch(
    *, table_oid: int, metadata_dict: SettableTableMetaData, database_id: int, **kwargs
) -> TableMetaData:
    """
    Alter metadata settings associated with a table for a database.

    Args:
        table_oid: Identity of the table whose metadata we'll modify.
        metadata_dict: The dict describing desired table metadata alterations.
        database_id: The Django id of the database containing the table.

    Returns:
        Altered metadata object.
    """
    table_meta_data = patch_table_meta_data(table_oid, metadata_dict, database_id)
    return TableMetaData.from_model(table_meta_data)
