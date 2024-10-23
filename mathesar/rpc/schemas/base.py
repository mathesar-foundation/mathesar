"""
Classes and functions exposed to the RPC endpoint for managing schemas.
"""
from typing import Literal, Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from db.constants import INTERNAL_SCHEMAS
from db.schemas import (
    create_schema,
    drop_schema_via_oid,
    get_schema,
    list_schemas,
    patch_schema,
)
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect


class SchemaInfo(TypedDict):
    """
    Information about a schema

    Attributes:
        oid: The OID of the schema
        name: The name of the schema
        description: A description of the schema
        owner_oid: The OID of the owner of the schema
        current_role_priv: All privileges available to the calling role
            on the schema.
        current_role_owns: Whether the current role is the owner of the
            schema (even indirectly).
        table_count: The number of tables in the schema
    """
    oid: int
    name: str
    description: Optional[str]
    owner_oid: int
    current_role_priv: list[Literal['USAGE', 'CREATE']]
    current_role_owns: bool
    table_count: int


class SchemaPatch(TypedDict):
    """
    Attributes:
        name: The name of the schema
        description: A description of the schema
    """
    name: Optional[str]
    description: Optional[str]


@rpc_method(name="schemas.add")
@http_basic_auth_login_required
@handle_rpc_exceptions
def add(
    *,
    name: str,
    database_id: int,
    owner_oid: int = None,
    description: Optional[str] = None,
    **kwargs,
) -> SchemaInfo:
    """
    Add a schema

    Args:
        name: The name of the schema to add.
        database_id: The Django id of the database containing the schema.
        owner_oid: The OID of the role who will own the new schema.
            If owner_oid is None, the current role will be the owner of the new schema.
        description: A description of the schema

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    with connect(database_id, kwargs.get(REQUEST_KEY).user) as conn:
        return create_schema(
            schema_name=name,
            conn=conn,
            owner_oid=owner_oid,
            description=description
        )


@rpc_method(name="schemas.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[SchemaInfo]:
    """
    List information about schemas in a database. Exposed as `list`.

    Args:
        database_id: The Django id of the database containing the table.

    Returns:
        A list of SchemaInfo objects
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        schemas = list_schemas(conn)

    return [s for s in schemas if s['name'] not in INTERNAL_SCHEMAS]


@rpc_method(name="schemas.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def get(*, schema_oid: int, database_id: int, **kwargs) -> SchemaInfo:
    """
    Get information about a schema in a database.

    Args:
        schema_oid: The OID of the schema to get.
        database_id: The Django id of the database containing the table.

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        schema_info = get_schema(schema_oid, conn)
    return schema_info


@rpc_method(name="schemas.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(*, schema_oid: int, database_id: int, **kwargs) -> None:
    """
    Delete a schema, given its OID.

    Args:
        schema_oid: The OID of the schema to delete.
        database_id: The Django id of the database containing the schema.
    """
    with connect(database_id, kwargs.get(REQUEST_KEY).user) as conn:
        drop_schema_via_oid(conn, schema_oid)


@rpc_method(name="schemas.patch")
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch(*, schema_oid: int, database_id: int, patch: SchemaPatch, **kwargs) -> SchemaInfo:
    """
    Patch a schema, given its OID.

    Args:
        schema_oid: The OID of the schema to delete.
        database_id: The Django id of the database containing the schema.
        patch: A SchemaPatch object containing the fields to update.

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    with connect(database_id, kwargs.get(REQUEST_KEY).user) as conn:
        return patch_schema(schema_oid, conn, patch)
