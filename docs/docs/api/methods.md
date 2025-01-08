# API Methods

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
