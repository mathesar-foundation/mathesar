from importlib import import_module


def test_rpc_endpoint_consistency_with_function_names(
    live_server,
    admin_client
):
    """
    Tests whether the names of registered RPC endpoints align with the
    corresponding Python methods.

    Fixtures:
        live_server(pytest-django): Provides the url for django testing server.
        admin_client(pytest-django): Provides a client logged in as a superuser.
    """
    list_methods = admin_client.post(
        path=f'{live_server.url}/api/rpc/v0/',
        data={
            "id": 1,
            "method": "system.listMethods",
            "jsonrpc": "2.0"
        },
        content_type="application/json"
    )
    methods = list_methods.json()['result']
    for method in methods:
        if not method.startswith('system.'):
            module_name, function_name = method.split('.')
            mod = import_module(f"mathesar.rpc.{module_name}")
            assert hasattr(mod, function_name)
            assert callable(getattr(mod, function_name))
