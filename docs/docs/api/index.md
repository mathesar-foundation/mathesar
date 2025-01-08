# Mathesar's API

Mathesar has an API available at `/api/rpc/v0/` which follows the [JSON-RPC](https://www.jsonrpc.org/specification) spec version 2.0. It has been built primarily for consumption by the Mathesar front end but theoretically could be used to build automation workflows and Mathesar integrations.

## Caveats

- The Mathesar API is **not yet stable**. If you build logic that depends on it, be mindful that future Mathesar versions will likely bring breaking changes to the API without warning or notice.

- This API _documentation_ is still in its early stages and may contain inaccuracies or incomplete information. If you encounter any issues, please [report](https://github.com/mathesar-foundation/mathesar/issues) them via GitHub.

- A small subset of functionality in Mathesar still relies on a legacy REST API which is gradually being phased out. It is not documented here.

## Usage

You can find a full list of Mathesar's RPC methods on the [API Methods page](./methods.md).

!!! tip "Converting Functions to API requests"
    The methods are shown as Python function definitions to make them easier to understand, but they need to be converted into JSON payloads for API calls.

    Here's how to convert a function call like this: `tables.list_(*, database_id=None, **kwargs)` into an API payload.

    1. The function name becomes the method path:
        - `tables.list_` converts to `"method": "tables.list"`
    2. Named parameters become part of the `"parameters"` object:
       ```json
       {
         "method": "tables.list",
         "parameters": {
           "database_id": 1
         }
       }
       ```

### Requests

To use an RPC method:

- Call it with a dot path starting from its root path.
- Always use named parameters.
- Ensure that your request includes HTTP headers for valid session IDs, as well as CSRF cookies and tokens.

!!! example

    To list information about tables for a schema, call the [`tables.list`](./methods/#tables.list_) method with a payload like this:

    `POST /api/rpc/v0/`

    ```json
    {
      "jsonrpc": "2.0",
      "id": 234,
      "method": "tables.list",
      "params": {
        "schema_oid": 47324,
        "database_id": 1
      }
    }
    ```

### Success Responses

Upon a successful RPC method call, the API will return a success object with the following form:

```json
{
  "jsonrpc": "2.0",
  "id": 234,
  "result": <any>
}
```

The `result` is whatever was returned by the underlying method.

### Error Responses

When an RPC method call fails, it generates an error response of the following form:

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

Other error codes are grouped according to the library that produced the Exception:

- `builtins`: -31xxx
- `psycopg` or `psycopg2`: -30xxx
- `django`: -29xxx
- `mathesar` (our code): -28xxx
- `db` (our code): -27xxx
- `sqlalchemy`: -26xxx
- other: -25xxx

Unrecognized errors from a given library return a "round number" code, so an unknown `builtins` error gets the code -31000.
