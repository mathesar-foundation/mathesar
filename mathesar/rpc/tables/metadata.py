"""
Classes and functions exposed to the RPC endpoint for managing table metadata.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.tables import get_table_meta_data


class TableMetaData(TypedDict):
    """
    Metadata for a table in a database.

    Only the `database`, `schema_oid`, and `table_oid` keys are required.

    Attributes:
        database_id: The Django id of the database containing the table.
        schema_oid: The OID of the schema containing the table.
        table_oid: The OID of the table in the database.
        import_verified: Specifies whether a file has been successfully imported into a table.
        column_order: The order in which columns of a table are displayed.
        preview_customized: Specifies whether the preview has been customized.
        preview_template: Preview template for a referent column.
    """
    database_id: int
    schema_oid: int
    table_oid: int
    import_verified: Optional[bool]
    column_order: Optional[list[int]]
    preview_customized: Optional[bool]
    preview_template: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            database_id=model.database.id,
            schema_oid=model.schema_oid,
            table_oid=model.table_oid,
            import_verified=model.import_verified,
            column_order=model.column_order,
            preview_customized=model.preview_customized,
            preview_template=model.preview_template,
        )


@rpc_method(name="tables.metadata.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list(*, schema_oid: int, database_id: int, **kwargs) -> list[TableMetaData]:
    """
    List metadata associated with tables for a schema.

    Args:
        schema_oid: Identity of the schema in the user's database.
        database_id: The Django id of the database containing the table.

    Returns:
        Metadata object for a given table oid.
    """
    table_meta_data = get_table_meta_data(schema_oid, database_id)
    return [
        TableMetaData.from_model(model) for model in table_meta_data
    ]
