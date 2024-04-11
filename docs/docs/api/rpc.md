# RPC API

Mathesar has an API available at `/api/rpc/v0/` which follows the [JSON-RPC](https://www.jsonrpc.org/specification) spec version 2.0.

## About

### Status

We are currently in the process of [transitioning](https://wiki.mathesar.org/projects/2024/architecture-transition/rpc/) our API architecture from a [RESTful](rest.md) API to this RPC-style API, and we hope to have all functionality available through the RPC API by Mathesar's beta release.

!!! caution "Stability"
    The RPC API is not yet stable and may change in the future, even after we've completed the transition to the RPC API architecture. If you build logic that depends on this API, be mindful that it may change in the future without warning or notice.

### Usage

To use an RPC function:

- Call it with a dot path starting from its root path.
- Always use named parameters.
- Ensure that your request includes HTTP headers for valid session IDs, as well as CSRF cookies and tokens.

!!! example

    To call function `add_from_known_connection` from the `connections` section of this page, you'd send something like:

    `POST /api/rpc/v0/`

    ```json
    {
      "jsonrpc": "2.0",
      "id": 234,
      "method": "connections.add_from_known_connection",
      "params": {
        "nickname": "anewconnection",
        "db_name": "mynewcooldb"
      },
    }
    ```

---

::: mathesar.rpc.connections
    options:
      members:
      - add_from_known_connection
      - add_from_scratch
      - DBModelReturn

## Responses

### Success

Upon a successful call to an RPC function, the API will return a success object. Such an object has the following form:

```json
{
  "jsonrpc": "2.0",
  "id": 234,
  "result": <any>
}
```

The `result` is whatever was returned by the underlying function.

### Errors

When an error is produced by a call to the RPC endpoint, we produce an error of the following form:

```json
{
  "jsonrpc": "2.0",
  "id": 234,
  "error": {
    "code": <int>,
    "message": <str>
  }
}
```

The `code` is a negative integer. Some codes are produced according to the [JSON-RPC spec](https://www.jsonrpc.org/specification#error_object).

More specific codes are produced according to the following documentation:

---

::: mathesar.rpc.exceptions.error_codes.get_error_code
