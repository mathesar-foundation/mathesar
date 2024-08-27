"""
This file tests wiring between the RPC endpoint and functions.

Fixtures:
    live_server(pytest-django): Provides the url for django testing server.
    admin_client(pytest-django): Provides a client logged in as a superuser.
"""
import pytest
from modernrpc.auth import user_is_authenticated, user_is_superuser

from mathesar.rpc import collaborators
from mathesar.rpc import columns
from mathesar.rpc import configured_roles
from mathesar.rpc import connections
from mathesar.rpc import constraints
from mathesar.rpc import data_modeling
from mathesar.rpc import database_privileges
from mathesar.rpc import database_setup
from mathesar.rpc import databases
from mathesar.rpc import explorations
from mathesar.rpc import records
from mathesar.rpc import roles
from mathesar.rpc import schemas
from mathesar.rpc import schema_privileges
from mathesar.rpc import servers
from mathesar.rpc import tables
from mathesar.rpc import table_privileges
from mathesar.rpc import types

METHODS = [
    (
        collaborators.add,
        "collaborators.add",
        [user_is_superuser]
    ),
    (
        collaborators.delete,
        "collaborators.delete",
        [user_is_superuser]
    ),
    (
        collaborators.list_,
        "collaborators.list",
        [user_is_authenticated]
    ),
    (
        collaborators.set_role,
        "collaborators.set_role",
        [user_is_superuser]
    ),
    (
        columns.delete,
        "columns.delete",
        [user_is_authenticated]
    ),
    (
        columns.list_,
        "columns.list",
        [user_is_authenticated]
    ),
    (
        columns.patch,
        "columns.patch",
        [user_is_authenticated]
    ),
    (
        columns.add,
        "columns.add",
        [user_is_authenticated]
    ),
    (
        columns.list_with_metadata,
        "columns.list_with_metadata",
        [user_is_authenticated]
    ),
    (
        columns.metadata.list_,
        "columns.metadata.list",
        [user_is_authenticated]
    ),
    (
        columns.metadata.set_,
        "columns.metadata.set",
        [user_is_authenticated]
    ),
    (
        configured_roles.add,
        "configured_roles.add",
        [user_is_superuser]
    ),
    (
        configured_roles.list_,
        "configured_roles.list",
        [user_is_authenticated]
    ),
    (
        configured_roles.delete,
        "configured_roles.delete",
        [user_is_superuser]
    ),
    (
        configured_roles.set_password,
        "configured_roles.set_password",
        [user_is_superuser]
    ),
    (
        connections.add_from_known_connection,
        "connections.add_from_known_connection",
        [user_is_superuser]
    ),
    (
        connections.add_from_scratch,
        "connections.add_from_scratch",
        [user_is_superuser]
    ),
    (
        connections.grant_access_to_user,
        "connections.grant_access_to_user",
        [user_is_superuser]
    ),
    (
        constraints.list_,
        "constraints.list",
        [user_is_authenticated]
    ),
    (
        constraints.add,
        "constraints.add",
        [user_is_authenticated]
    ),
    (
        constraints.delete,
        "constraints.delete",
        [user_is_authenticated]
    ),
    (
        data_modeling.add_foreign_key_column,
        "data_modeling.add_foreign_key_column",
        [user_is_authenticated]
    ),
    (
        data_modeling.add_mapping_table,
        "data_modeling.add_mapping_table",
        [user_is_authenticated]
    ),
    (
        data_modeling.suggest_types,
        "data_modeling.suggest_types",
        [user_is_authenticated]
    ),
    (
        database_privileges.list_direct,
        "database_privileges.list_direct",
        [user_is_authenticated]
    ),
    (
        database_privileges.get_owner_oid_and_curr_role_db_priv,
        "database_privileges.get_owner_oid_and_curr_role_db_priv",
        [user_is_authenticated]
    ),
    (
        database_privileges.replace_for_roles,
        "database_privileges.replace_for_roles",
        [user_is_authenticated]
    ),
    (
        database_setup.create_new,
        "database_setup.create_new",
        [user_is_superuser]
    ),
    (
        database_setup.connect_existing,
        "database_setup.connect_existing",
        [user_is_superuser]
    ),
    (
        databases.list_,
        "databases.list",
        [user_is_authenticated]
    ),
    (
        records.list_,
        "records.list",
        [user_is_authenticated]
    ),
    (
        records.get,
        "records.get",
        [user_is_authenticated]
    ),
    (
        records.add,
        "records.add",
        [user_is_authenticated]
    ),
    (
        records.patch,
        "records.patch",
        [user_is_authenticated]
    ),
    (
        records.delete,
        "records.delete",
        [user_is_authenticated]
    ),
    (
        records.search,
        "records.search",
        [user_is_authenticated]
    ),
    (
        explorations.list_,
        "explorations.list",
        [user_is_authenticated]
    ),
    (
        explorations.get,
        "explorations.get",
        [user_is_authenticated]
    ),
    (
        explorations.add,
        "explorations.add",
        [user_is_authenticated]
    ),
    (
        explorations.delete,
        "explorations.delete",
        [user_is_authenticated]
    ),
    (
        explorations.replace,
        "explorations.replace",
        [user_is_authenticated]
    ),
    (
        explorations.run,
        "explorations.run",
        [user_is_authenticated]
    ),
    (
        explorations.run_saved,
        "explorations.run_saved",
        [user_is_authenticated]
    ),
    (
        roles.list_,
        "roles.list",
        [user_is_authenticated]
    ),
    (
        roles.add,
        "roles.add",
        [user_is_authenticated]
    ),
    (
        schemas.add,
        "schemas.add",
        [user_is_authenticated]
    ),
    (
        schemas.list_,
        "schemas.list",
        [user_is_authenticated]
    ),
    (
        schemas.delete,
        "schemas.delete",
        [user_is_authenticated]
    ),
    (
        schemas.patch,
        "schemas.patch",
        [user_is_authenticated]
    ),
    (
        schema_privileges.list_direct,
        "schema_privileges.list_direct",
        [user_is_authenticated]
    ),
    (
        schema_privileges.replace_for_roles,
        "schema_privileges.replace_for_roles",
        [user_is_authenticated]
    ),
    (
        servers.list_,
        "servers.list",
        [user_is_authenticated]
    ),
    (

        types.list_,
        "types.list",
        [user_is_authenticated]
    ),
    (
        tables.list_,
        "tables.list",
        [user_is_authenticated]
    ),
    (
        tables.list_with_metadata,
        "tables.list_with_metadata",
        [user_is_authenticated]
    ),
    (
        tables.get,
        "tables.get",
        [user_is_authenticated]
    ),
    (
        tables.add,
        "tables.add",
        [user_is_authenticated]
    ),
    (
        tables.delete,
        "tables.delete",
        [user_is_authenticated]
    ),
    (
        tables.patch,
        "tables.patch",
        [user_is_authenticated]
    ),
    (
        tables.import_,
        "tables.import",
        [user_is_authenticated]
    ),
    (
        tables.get_import_preview,
        "tables.get_import_preview",
        [user_is_authenticated]
    ),
    (
        tables.list_joinable,
        "tables.list_joinable",
        [user_is_authenticated]
    ),
    (
        table_privileges.list_direct,
        "table_privileges.list_direct",
        [user_is_authenticated]
    ),
    (
        tables.metadata.list_,
        "tables.metadata.list",
        [user_is_authenticated]
    ),
    (
        tables.metadata.set_,
        "tables.metadata.set",
        [user_is_authenticated]
    )
]


def test_rpc_endpoint_expected_methods(live_server, admin_client):
    """Smoketest checks that we have exposed the expected methods."""
    all_methods = admin_client.post(
        path=f"{live_server.url}/api/rpc/v0/",
        data={
            "id": 1,
            "method": "system.listMethods",
            "jsonrpc": "2.0"
        },
        content_type="application/json"
    ).json()["result"]
    mathesar_methods = [m for m in all_methods if not m.startswith("system.")]
    assert sorted(mathesar_methods) == sorted(m[1] for m in METHODS)


@pytest.mark.parametrize("func,exposed_name,auth_pred_params", METHODS)
def test_correctly_exposed(func, exposed_name, auth_pred_params):
    """Tests to make sure every RPC function is correctly wired up."""
    # Make sure we didn't typo the function names for the endpoint.
    assert func.modernrpc_enabled is True
    assert func.modernrpc_name == exposed_name
    # Make sure other decorators are set as expected.
    assert func.rpc_exceptions_handled is True
    assert func.modernrpc_auth_predicates_params == [auth_pred_params]
