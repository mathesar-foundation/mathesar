# Mathesar's API

Mathesar has an API available at `/api/rpc/v0/` which follows the [JSON-RPC](https://www.jsonrpc.org/specification) spec version 2.0. It has been built primarily for consumption by the Mathesar front end but theoretically could be used to build automation workflows and Mathesar integrations.

## Caveats

- The Mathesar API is **not yet stable**. If you build logic that depends on it, be mindful that future Mathesar versions will likely bring breaking changes to the API without warning or notice.

- This API _documentation_ is somewhat rough. We encourage you to report any docs inaccuracies via GitHub [issues](https://github.com/mathesar-foundation/mathesar/issues).

- A small subset of functionality in Mathesar still relies on a legacy REST API which is gradually being phased out. It is not documented here.

## Usage

### Requests

To use an RPC function:

- Call it with a dot path starting from its root path.
- Always use named parameters.
- Ensure that your request includes HTTP headers for valid session IDs, as well as CSRF cookies and tokens.

!!! example

    To call function `tables.list` from the Tables section of this page, you'd send something like:

    `POST /api/rpc/v0/`b

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

Upon a successful call to an RPC function, the API will return a success object. Such an object has the following form:

```json
{
  "jsonrpc": "2.0",
  "id": 234,
  "result": <any>
}
```

The `result` is whatever was returned by the underlying function.

### Error Responses

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

Other error codes are grouped according to the library that produced the Exception:

- `builtins`: -31xxx
- `psycopg` or `psycopg2`: -30xxx
- `django`: -29xxx
- `mathesar` (our code): -28xxx
- `db` (our code): -27xxx
- `sqlalchemy`: -26xxx
- other: -25xxx

Unrecognized errors from a given library return a "round number" code, so an unknown `builtins` error gets the code -31000.
