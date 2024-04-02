# Using the RPC endpoint

As of release 0.1.7, Mathesar comes with a new RPC endpoint, available at `/rpc/`. This endpoint lets you (or the front end) call some back end functions directly, using the JSON-RPC 2.0 protocol. The documentation of these functions is available here. To use an RPC function, call it with a dot path starting from its root path. So, to call function `my_func` from the `connections` section, you'd call `connections.my_func`.

::: mathesar.rpc.connections
