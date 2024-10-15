"""
Classes and functions exposed to the RPC endpoint for managing data models.
"""
from typing import TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.links.operations import create as links_create
from db.tables.operations import infer_types, split, move_columns as move_cols
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


@rpc_method(name="data_modeling.add_foreign_key_column")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add_foreign_key_column(
        *,
        column_name: str,
        referrer_table_oid: int,
        referent_table_oid: int,
        database_id: int,
        **kwargs
) -> None:
    """
    Add a foreign key column to a table.

    The foreign key column will be newly created, and will reference the
    `id` column of the referent table.

    Args:
        column_name: The name of the column to create.
        referrer_table_oid: The OID of the table getting the new column.
        referent_table_oid: The OID of the table being referenced.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        links_create.add_foreign_key_column(
            conn, column_name, referrer_table_oid, referent_table_oid
        )


class MappingColumn(TypedDict):
    """
    An object defining a foreign key column in a mapping table.

    Attributes:
        column_name: The name of the foreign key column.
        referent_table_oid: The OID of the table the column references.
    """
    column_name: str
    referent_table_oid: int


@rpc_method(name="data_modeling.add_mapping_table")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add_mapping_table(
        *,
        table_name: str,
        mapping_columns: list[MappingColumn],
        schema_oid: int,
        database_id: int,
        **kwargs
) -> None:
    """
    Add a mapping table to give a many-to-many link between referents.

    The foreign key columns in the mapping table will reference the `id`
    column of the referent tables.

    Args:
        table_name: The name for the new mapping table.
        schema_oid: The OID of the schema for the mapping table.
        mapping_columns: The foreign key columns to create in the
            mapping table.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        links_create.add_mapping_table(
            conn, schema_oid, table_name, mapping_columns
        )


@rpc_method(name="data_modeling.suggest_types")
@http_basic_auth_login_required
@handle_rpc_exceptions
def suggest_types(*, table_oid: int, database_id: int, **kwargs) -> dict:
    """
    Infer the best type for each column in the table.

    Currently we only suggest different types for columns which originate
    as type `text`.

    Args:
        table_oid: The OID of the table whose columns we're inferring types for.
        database_id: The Django id of the database containing the table.

    The response JSON will have attnum keys, and values will be the
    result of `format_type` for the inferred type of each column, i.e., the
    canonical string referring to the type.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return infer_types.infer_table_column_data_types(conn, table_oid)


class SplitTableInfo(TypedDict):
    """
    Information about a table, created from column extraction.

    Attributes:
        extracted_table_oid: The OID of the table that is created from column extraction.
        new_fkey_attnum: The attnum of the newly created foreign key column
                         referring the extracted_table on the original table.
    """
    extracted_table_oid: int
    new_fkey_attnum: int


@rpc_method(name="data_modeling.split_table")
@http_basic_auth_login_required
@handle_rpc_exceptions
def split_table(
    *,
    table_oid: int,
    column_attnums: list,
    extracted_table_name: str,
    database_id: int,
    relationship_fk_column_name: str = None,
    **kwargs
) -> SplitTableInfo:
    """
    Extract columns from a table to create a new table, linked by a foreign key.

    Args:
        table_oid: The OID of the table whose columns we'll extract.
        column_attnums: A list of the attnums of the columns to extract.
        extracted_table_name: The name of the new table to be made from the extracted columns.
        database_id: The Django id of the database containing the table.
        relationship_fk_column_name: The name to give the new foreign key column in the remainder table (optional)

    Returns:
        The SplitTableInfo object describing the details for the created table as a result of column extraction.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return split.split_table(
            conn,
            table_oid,
            column_attnums,
            extracted_table_name,
            relationship_fk_column_name
        )


@rpc_method(name="data_modeling.move_columns")
@http_basic_auth_login_required
@handle_rpc_exceptions
def move_columns(
    *,
    source_table_oid: int,
    target_table_oid: int,
    move_column_attnums: list[int],
    database_id: int,
    **kwargs
) -> None:
    """
    Extract columns from a table to a referent table, linked by a foreign key.

    Args:
        source_table_oid: The OID of the source table whose column(s) we'll extract.
        target_table_oid: The OID of the target table where the extracted column(s) will be added.
        move_column_attnums: The list of attnum(s) to move from source table to the target table.
        database_id: The Django id of the database containing the table.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        move_cols.move_columns_to_referenced_table(
            conn,
            source_table_oid,
            target_table_oid,
            move_column_attnums
        )
