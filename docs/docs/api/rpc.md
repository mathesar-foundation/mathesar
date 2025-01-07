# RPC API

Mathesar has an API available at `/api/rpc/v0/` which follows the [JSON-RPC](https://www.jsonrpc.org/specification) spec version 2.0.

!!! danger "Not yet stable"
    The RPC API is not yet stable and may change in the future. If you build logic that depends on this API, be mindful that it may change in the future without warning or notice.

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

### Responses

#### Success

Upon a successful call to an RPC function, the API will return a success object. Such an object has the following form:

```json
{
  "jsonrpc": "2.0",
  "id": 234,
  "result": <any>
}
```

The `result` is whatever was returned by the underlying function.

#### Errors

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

---

## Analytics
::: analytics
    options:
      members:
      - initialize
      - disable
      - view_report

## Collaborators

::: collaborators
    options:
      members:
      - list_
      - add
      - delete
      - set_role
      - CollaboratorInfo

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

## Configured Databases

::: databases.configured
    options:
      members:
      - list_
      - disconnect
      - ConfiguredDatabaseInfo

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

## Data Modeling

:::data_modeling
    options:
      members:
      - add_foreign_key_column
      - add_mapping_table
      - suggest_types
      - split_table
      - move_columns
      - MappingColumn
      - SplitTableInfo

## Databases

::: databases
    options:
      members:
      - get
      - delete
      - upgrade_sql
      - DatabaseInfo

## Database Privileges

::: databases.privileges
    options:
      members:
      - list_direct
      - replace_for_roles
      - transfer_ownership
      - DBPrivileges

## Database Setup

::: databases.setup
    options:
      members:
      - create_new
      - connect_existing
      - DatabaseConnectionResult

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

## Roles

::: roles
    options:
      members:
      - list_
      - add
      - delete
      - get_current_role
      - set_members
      - RoleInfo
      - RoleMember

## Roles Configured

::: roles.configured
    options:
      members:
      - list_
      - add
      - delete
      - set_password
      - ConfiguredRoleInfo

## Schemas

::: schemas
    options:
      members:
      - list_
      - get
      - add
      - delete
      - patch
      - SchemaInfo
      - SchemaPatch

## Schema Privileges

::: schemas.privileges
    options:
      members:
      - list_direct
      - replace_for_roles
      - transfer_ownership
      - SchemaPrivileges

## Servers

::: servers
    options:
      members:
      - list_
      - ConfiguredServerInfo

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
      - list_with_metadata
      - get_with_metadata
      - TableInfo
      - AddedTableInfo
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

## Table Privileges

::: tables.privileges
    options:
      members:
      - list_direct
      - replace_for_roles
      - transfer_ownership
      - TablePrivileges

## Users

::: users
    options:
      members:
      - list_
      - get
      - add
      - delete
      - patch_self
      - patch_other
      - replace_own
      - revoke
      - UserInfo
      - UserDef
