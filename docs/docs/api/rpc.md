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

## Collaborators

::: collaborators
    options:
      members:
      - list_
      - add
      - delete
      - set_role
      - CollaboratorInfo

## ConfiguredRoles

::: configured_roles
    options:
      members:
      - list_
      - add
      - delete
      - set_password
      - ConfiguredRoleInfo

## Connections

::: connections
    options:
      members:
      - add_from_known_connection
      - add_from_scratch
      - grant_access_to_user
      - ConnectionReturn

## Databases

::: databases
    options:
      members:
      - list_
      - DatabaseInfo

## Database Privileges

::: database_privileges
    options:
      members:
      - list_direct
      - get_owner_oid_and_curr_role_db_priv
      - DBPrivileges
      - CurrentDBPrivileges

## Database Setup

::: database_setup
    options:
      members:
      - create_new
      - connect_existing
      - DatabaseConnectionResult

## Schemas

::: schemas
    options:
      members:
      - list_
      - add
      - delete
      - patch
      - SchemaInfo
      - SchemaPatch

## Tables

::: tables
    options:
      members:
      - list_
      - get
      - add
      - delete
      - patch
      - import_
      - get_import_preview
      - list_joinable
      - TableInfo
      - SettableTableInfo
      - JoinableTableRecord
      - JoinableTableInfo

## Table Metadata

::: tables.metadata
    options:
      members:
      - list_
      - set_
      - TableMetaDataBlob
      - TableMetaDataRecord

## Columns

::: columns
    options:
      members:
      - list_
      - add
      - patch
      - delete
      - list_with_metadata
      - ColumnInfo
      - ColumnListReturn
      - CreatableColumnInfo
      - PreviewableColumnInfo
      - SettableColumnInfo
      - TypeOptions
      - ColumnDefault
 
## Column Metadata

::: columns.metadata
    options:
      members:
      - list_
      - set_
      - ColumnMetaDataRecord
      - ColumnMetaDataBlob

## Types

::: types
    options:
      members:
      - list_
      - TypeInfo

## Constraints

::: constraints
    options:
      members:
      - list_
      - add
      - delete
      - Constraint
      - ForeignKeyConstraint
      - PrimaryKeyConstraint
      - UniqueConstraint
      - CreatableConstraintInfo

## Records

:::records
    options:
      members:
      - list_
      - get
      - add
      - patch
      - delete
      - search
      - RecordList
      - RecordAdded
      - OrderBy
      - Filter
      - FilterAttnum
      - FilterLiteral
      - Grouping
      - Group
      - GroupingResponse
      - SearchParam

## Explorations

::: explorations
    options:
      members:
      - list_
      - get
      - add
      - delete
      - replace
      - run
      - run_saved
      - ExplorationInfo
      - ExplorationDef
      - ExplorationResult

## Roles

::: roles
    options:
      members:
      - list_
      - RoleInfo
      - RoleMember

## Servers

::: servers
    options:
      members:
      - list_
      - ServerInfo

## Data Modeling

:::data_modeling
    options:
      members:
      - add_foreign_key_column
      - add_mapping_table
      - suggest_types
      - MappingColumn

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

Other error codes are grouped according to the library that produced the Exception:

- `builtins`: -31xxx
- `psycopg` or `psycopg2`: -30xxx
- `django`: -29xxx
- `mathesar` (our code): -28xxx
- `db` (our code): -27xxx
- `sqlalchemy`: -26xxx
- other: -25xxx

Unrecognized errors from a given library return a "round number" code, so an unknown `builtins` error gets the code -31000.
