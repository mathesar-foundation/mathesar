"""
Classes and functions exposed to the RPC endpoint for managing data models.
"""
from typing import Literal, Optional, TypedDict

from modernrpc.core import REQUEST_KEY

from db import links, tables
from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.rpc.utils import connect


@mathesar_rpc_method(name="data_modeling.add_foreign_key_column", auth="login")
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
        links.add_foreign_key_column(
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


@mathesar_rpc_method(name="data_modeling.add_mapping_table", auth="login")
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
        links.add_mapping_table(
            conn, schema_oid, table_name, mapping_columns
        )


@mathesar_rpc_method(name="data_modeling.suggest_types", auth="login")
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
        return tables.infer_table_column_data_types(conn, table_oid)


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


@mathesar_rpc_method(name="data_modeling.split_table", auth="login")
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
        return tables.split_table(
            conn,
            table_oid,
            column_attnums,
            extracted_table_name,
            relationship_fk_column_name
        )


@mathesar_rpc_method(name="data_modeling.move_columns", auth="login")
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
        tables.move_columns_to_referenced_table(
            conn,
            source_table_oid,
            target_table_oid,
            move_column_attnums
        )


@mathesar_rpc_method(name="data_modeling.change_primary_key_column", auth="login")
def change_primary_key_column(
        *,
        column_attnum: int,
        table_oid: int,
        database_id: int,
        default: Optional[Literal['IDENTITY', 'UUIDv4']] = None,
        drop_existing_pk_column: bool = False,
        **kwargs
) -> None:
    """
    Change which column is used for a single-column primary key.

    The `default` settings map as follows:
        - 'IDENTITY': `GENERATED BY DEFAULT AS IDENTITY`
        - 'UUIDv4': `gen_random_uuid()`
        - null: No default set

    Note that for clarity and safety, we *do not* drop any preexisitng
    default on the column targeted.

    Note that in cases where 'IDENTITY' is requested, but the column is
    not an integer, we first attempt to cast the column to `integer`,
    and then proceed only if that succeeds.

    Args:
        column_attnum: The attnum of the column to use for the pkey.
        table_oid: The OID of the table whose primary key we'll set.
        database_id: The Django id of the database containing the table.
        default: A flag specifying the default generating function.
        drop_existing_pk_column: Whether we should drop the current pkey
            column.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        tables.set_primary_key_column_on_table(
            conn,
            table_oid,
            column_attnum,
            default_type=default,
            drop_old_pkey_column=drop_existing_pk_column,
        )
