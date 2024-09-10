"""
Classes and functions exposed to the RPC endpoint for managing table metadata.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.tables import get_tables_meta_data, set_table_meta_data


class TableMetaDataRecord(TypedDict):
    """
    Metadata for a table in a database.

    Only the `database` and `table_oid` keys are required.

    Attributes:
        id: The Django id of the TableMetaData object.
        database_id: The Django id of the database containing the table.
        table_oid: The OID of the table in the database.
        data_file_id: Specifies the DataFile model id used for the import.
        import_verified: Specifies whether a file has been successfully imported into a table.
        column_order: The order in which columns of a table are displayed.
        record_summary_customized: Specifies whether the record summary has been customized.
        record_summary_template: Record summary template for a referent column.
    """
    id: int
    database_id: int
    table_oid: int
    data_file_id: Optional[int]
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
            data_file_id=model.data_file.id if model.data_file is not None else None,
            import_verified=model.import_verified,
            column_order=model.column_order,
            record_summary_customized=model.record_summary_customized,
            record_summary_template=model.record_summary_template,
        )


class TableMetaDataBlob(TypedDict):
    """
    The metadata fields which can be set on a table

    Attributes:
        data_file_id: Specifies the DataFile model id used for the import.
        import_verified: Specifies whether a file has been successfully imported into a table.
        column_order: The order in which columns of a table are displayed.
        record_summary_customized: Specifies whether the record summary has been customized.
        record_summary_template: Record summary template for a referent column.
    """
    data_file_id: Optional[int]
    import_verified: Optional[bool]
    column_order: Optional[list[int]]
    record_summary_customized: Optional[bool]
    record_summary_template: Optional[str]


@rpc_method(name="tables.metadata.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[TableMetaDataRecord]:
    """
    List metadata associated with tables for a database.

    Args:
        database_id: The Django id of the database containing the table.

    Returns:
        Metadata object for a given table oid.
    """
    table_meta_data = get_tables_meta_data(database_id)
    return [
        TableMetaDataRecord.from_model(model) for model in table_meta_data
    ]


@rpc_method(name="tables.metadata.set")
@http_basic_auth_login_required
@handle_rpc_exceptions
def set_(
    *, table_oid: int, metadata: TableMetaDataBlob, database_id: int, **kwargs
) -> None:
    """
    Set metadata for a table.

    Args:
        table_oid: The PostgreSQL OID of the table.
        metadata: A TableMetaDataBlob object describing desired table metadata to set.
        database_id: The Django id of the database containing the table.
    """
    set_table_meta_data(table_oid, metadata, database_id)
