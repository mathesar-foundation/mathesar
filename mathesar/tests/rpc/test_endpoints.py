"""
This file tests wiring between the RPC endpoint and functions.

Fixtures:
    live_server(pytest-django): Provides the url for django testing server.
    admin_client(pytest-django): Provides a client logged in as a superuser.
"""
import pytest
from modernrpc.core import Protocol
from modernrpc.auth import user_is_authenticated, user_is_superuser

from mathesar.rpc import columns
from mathesar.rpc import connections


exposed_functions = [
    "columns.list",
    "connections.add_from_known_connection",
    "connections.add_from_scratch",
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
    expect_methods = [
        "columns.list",
        "connections.add_from_known_connection",
        "connections.add_from_scratch",
    ]
    assert sorted(mathesar_methods) == expect_methods


@pytest.mark.parametrize(
    "func,exposed_name,auth_pred_params",
    [
        (
            columns.list_,
            "columns.list",
            [user_is_authenticated]
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
        )
    ]
)
def test_correctly_exposed(func, exposed_name, auth_pred_params):
    """Tests to make sure every RPC function is correctly wired up."""
    # Make sure we didn't typo the function names for the endpoint.
    assert func.modernrpc_enabled is True
    assert func.modernrpc_name == exposed_name
    # Make sure other decorators are set as expected.
    assert func.rpc_exceptions_handled is True
    assert func.modernrpc_auth_predicates_params == [auth_pred_params]
