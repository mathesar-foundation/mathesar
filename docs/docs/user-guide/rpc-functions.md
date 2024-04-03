# Using the RPC endpoint

As of release 0.1.7, Mathesar comes with an RPC endpoint, available at `/api/rpc/v0/`. This endpoint enables calling some backend functions directly, using the JSON-RPC 2.0 protocol. The documentation of these functions is available on this page. To use an RPC function, call it with a dot path starting from its root path. So, to call function `create_from_known_connection` from the `connections` section of this page, you'd send something like:

```
POST /api/rpc/v0/
```
```json
{
    "jsonrpc": "2.0",
    "method": "connections.create_from_known_connection",
    "params": {"nickname": "anewconnection", "db_name": "mynewcooldb"},
    "id": 234
}
```

Note that 

- all parameters for all functions documented here are keyword parameters (even the required ones). In other words, 
- no positional arguments are allowed.
- Requests must be made with valid session IDs, as well as CSRF cookies and tokens.

::: mathesar.rpc.connections
