# RPC API

Mathesar has an API available at `/api/rpc/v0/` which follows the [JSON-RPC](https://www.jsonrpc.org/specification) spec version 2.0.

## About

### Status

We are currently in the process of [transitioning](https://wiki.mathesar.org/projects/2024/architecture-transition/rpc/) our API architecture from a [RESTful](../rest.md) API to this RPC-style API, and we hope to have all functionality available through the RPC API by Mathesar's beta release.

!!! caution "Stability"
    The RPC API is not yet stable and may change in the future, even after we've completed the transition to the RPC API architecture. If you build logic that depends on this API, be mindful that it may change in the future without warning or notice.

### Usage

To use an RPC function:

- Call it with a dot path starting from its root path.
- Always use named parameters.
- Ensure that your request includes HTTP headers for valid session IDs, as well as CSRF cookies and tokens.

!!! example

    To call function `create_from_known_connection` from the `connections` section of this page, you'd send something like:

    `POST /api/rpc/v0/`

    ```json
    {
      "jsonrpc": "2.0",
      "id": 234,
      "method": "connections.create_from_known_connection",
      "params": {
        "nickname": "anewconnection",
        "db_name": "mynewcooldb"
      },
    }
    ```

---

::: mathesar.rpc.connections
