# Developer Guide: Adding New Types to Mathesar

This guide provides a comprehensive overview of how to add new types (also called "abstract types" or "UI types") to the Mathesar system. It covers the full stack from database models to frontend components, using the User type implementation from this PR as a reference example.

## Table of Contents

1. [Introduction & Overview](#introduction--overview)
2. [Understanding the Type System Layers](#understanding-the-type-system-layers)
3. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
4. [Advanced Topics](#advanced-topics)
5. [Complete Example: User Type](#complete-example-user-type)
6. [Testing Considerations](#testing-considerations)
7. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Introduction & Overview

### What are UI Types?

Mathesar has a type system that operates at two levels:

1. **Database Types (DB Types)**: The actual PostgreSQL column types (e.g., `INTEGER`, `TEXT`, `JSONB`, `TIMESTAMP`)
2. **Abstract Types (UI Types)**: Higher-level types that provide rich UI experiences and can map to one or more database types

For example:

- The **Email** abstract type maps to the `mathesar_types.email` database type
- The **Number** abstract type maps to multiple database types: `INTEGER`, `NUMERIC`, `BIGINT`, `REAL`, etc.
- The **User** abstract type maps to `INTEGER` (stores user IDs) but is distinguished by metadata

### Key Concepts

- **Type Identification**: How the system determines which abstract type a column represents
- **Column Metadata**: Additional configuration stored in Django that augments database columns
- **Display Values**: Computed values that provide human-readable representations (e.g., showing "John Doe" instead of user ID `42`)
- **Type-Specific Behavior**: Special functionality like auto-population, validation, or custom filtering

### Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                        Frontend Layer                      │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Type Config     │  │ Cell         │  │ Form          │  │
│  │ (Definition)    │  │ Components   │  │ Configuration │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │ RPC API
┌────────────────────────────────────────────────────────────┐
│                        Backend Layer                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Column Metadata │  │ RPC          │  │ Utility       │  │
│  │ (Django Model)  │  │ Endpoints    │  │ Functions     │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │   Database    │
                    └───────────────┘
```

---

## Understanding the Type System Layers

### Backend Layer (Django)

#### 1. Column Metadata Model

**Location**: `mathesar/models/base.py`

The `ColumnMetaData` model stores additional configuration for columns beyond what PostgreSQL provides. Each type-specific feature typically adds new fields to this model.

```python
class ColumnMetaData(BaseModel):
    database = models.ForeignKey('Database', on_delete=models.CASCADE)
    table_oid = models.PositiveBigIntegerField()
    attnum = models.SmallIntegerField()

    # Type-specific metadata fields
    bool_input = models.CharField(...)
    bool_true = models.CharField(null=True)
    bool_false = models.CharField(null=True)
    # ... more type-specific fields

    # User type metadata (example)
    user_type = models.BooleanField(default=False, null=True)
    user_display_field = models.CharField(...)
    user_last_edited_by = models.BooleanField(default=False, null=True)
```

Key characteristics:

- Unique constraint on `(database, table_oid, attnum)` ensures one metadata record per column
- Fields can be nullable to support optional configuration
- Can include CHECK constraints for field validation

#### 2. Database Migrations

**Location**: `mathesar/migrations/`

When adding new metadata fields, create a Django migration:

```python
# Example: mathesar/migrations/0010_columnmetadata_user_type.py
operations = [
    migrations.AddField(
        model_name="columnmetadata",
        name="user_type",
        field=models.BooleanField(default=False, null=True),
    ),
    migrations.AddField(
        model_name="columnmetadata",
        name="user_display_field",
        field=models.CharField(
            choices=[
                ("full_name", "full_name"),
                ("email", "email"),
                ("username", "username"),
            ],
            default="full_name",
            max_length=50,
        ),
    ),
]
```

#### 3. RPC Metadata Endpoints

**Location**: `mathesar/rpc/columns/metadata.py`

The metadata must be exposed to the frontend via RPC:

```python
class ColumnMetaDataRecord(TypedDict):
    """Full metadata record with all fields"""
    database_id: int
    table_oid: int
    attnum: int
    # ... existing fields ...
    user_type: Optional[bool]
    user_display_field: Literal["full_name", "email", "username"]
    user_last_edited_by: Optional[bool]

class ColumnMetaDataBlob(TypedDict):
    """Settable metadata fields (without database_id, table_oid)"""
    attnum: int
    # ... existing fields ...
    user_type: Optional[bool]
    user_display_field: Optional[Literal["full_name", "email", "username"]]
    user_last_edited_by: Optional[bool]
```

The RPC methods `columns.metadata.list` and `columns.metadata.set` handle reading and writing this metadata.

#### 4. Type-Specific Utility Functions

**Location**: `mathesar/utils/` (create new modules as needed)

For complex type behaviors, create dedicated utility modules:

**Example**: `mathesar/utils/user_display.py`

```python
def get_user_display_values_for_column(
    table_oid: int,
    database_id: int,
    column_attnum: int,
    user_ids: set[Optional[int]]
) -> dict[str, str]:
    """
    Fetch display values for user IDs from Django User model.
    Returns a mapping of user_id -> display_string
    """
    # Implementation fetches from User model based on metadata config
```

These utilities are often called from RPC endpoints to augment record data before sending to the frontend.

#### 5. Record Processing (Optional)

**Location**: `mathesar/rpc/records.py`

Some types require special handling when fetching or saving records:

```python
def _add_user_display_values_to_record_info(
    record_info: dict,
    table_oid: int,
    database_id: int,
) -> None:
    """
    Augment record responses with user display values.

    This function:
    1. Detects user columns in the table
    2. Extracts user IDs from record results
    3. Fetches display values from Django User model
    4. Adds them to the 'linked_record_summaries' structure
    """
    user_column_attnums = get_user_columns_for_table(table_oid, database_id)

    for column_attnum in user_column_attnums:
        user_ids = {record.get(str(column_attnum)) for record in results}
        display_values = get_user_display_values_for_column(
            table_oid, database_id, column_attnum, user_ids
        )
        record_info["linked_record_summaries"][str(column_attnum)] = display_values
```

This pattern allows the backend to provide rich display values without modifying the actual database data.

### Frontend Layer (Svelte/TypeScript)

#### 1. Abstract Type Configuration

**Location**: `mathesar_ui/src/stores/abstract-types/type-configs/[type-name]/`

This is the core definition of your type. Create a file implementing the `AbstractTypeConfiguration` interface:

```typescript
// mathesar_ui/src/stores/abstract-types/type-configs/user/user.ts

const userType: AbstractTypeConfiguration = {
  // Icon displayed in UI
  getIcon: () => ({ ...iconUser, label: 'User' }),

  // Default PostgreSQL type when creating this column type
  defaultDbType: DB_TYPES.INTEGER,

  // Cell data type (used to determine which cell components to render)
  cellInfo: {
    type: 'user',
  },

  // Optional: Database options form
  getDbConfig: (): AbstractTypeDbConfig => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),

  // Optional: Display options form
  getDisplayConfig: (): AbstractTypeDisplayConfig => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),

  // Optional: Conditional availability
  getEnabledState: () => ({ enabled: true }),
};
```

**Key Configuration Functions**:

- **`determineDbTypeAndOptions`**: Convert form values → database type and type_options
- **`constructDbFormValuesFromTypeOptions`**: Convert type_options → form values (for editing)
- **`determineDisplayOptions`**: Convert form values → metadata
- **`constructDisplayFormValuesFromDisplayOptions`**: Convert metadata → form values (for editing)

#### 2. Form Configurations

Forms allow users to configure type-specific options when creating or editing columns:

```typescript
// Database options form (appears in "Type" tab)
const dbForm: AbstractTypeConfigForm = {
  variables: {
    lastEditedBy: {
      type: 'boolean',
      default: false,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'lastEditedBy',
        label: 'Use as "Last edited by" column',
      },
    ],
  },
};

// Display options form (appears in "Display" tab)
const displayForm: AbstractTypeConfigForm = {
  variables: {
    displayField: {
      type: 'string',
      enum: ['full_name', 'email', 'username'],
      default: 'full_name',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'displayField',
        label: 'Field to represent each user',
        options: {
          full_name: { label: 'Display Name' },
          email: { label: 'Email' },
          username: { label: 'Username' },
        },
      },
    ],
  },
};
```

#### 3. Cell Component Factory

**Location**: `mathesar_ui/src/components/cell-fabric/data-types/`

Define how cells of this type are rendered:

```typescript
// mathesar_ui/src/components/cell-fabric/data-types/user.ts

const userType: CellComponentFactory = {
  initialInputValue: null,

  // Display component (read-only view)
  get: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserCell,
    props: {
      userDisplayField: getMetadataValue(column.metadata, 'user_display_field'),
    },
  }),

  // Input component (edit mode)
  getInput: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'full_name',
    },
  }),

  // Filter input (for search/filtering) - optional
  getSimpleInput: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserFilterInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'full_name',
    },
  }),

  // Display formatter for string representation
  getDisplayFormatter: () => String,
};
```

#### 4. Cell Components

**Location**: `mathesar_ui/src/components/cell-fabric/data-types/components/[type-name]/`

Create Svelte components for rendering and editing cells:

- **`UserCell.svelte`**: Display component showing the user value (with dropdown for selection)
- **`UserInput.svelte`**: Input component for adding/editing user values
- **`UserFilterInput.svelte`**: Simplified input for filtering (optional)

These components should:

- Handle the cell value lifecycle (display, edit, save)
- Support keyboard navigation and accessibility
- Integrate with the record summary system for display values
- Handle loading states and errors gracefully

#### 5. Type Registration

**Location**: `mathesar_ui/src/stores/abstract-types/abstractTypeCategories.ts`

Register your type with the system:

**Step 1**: Add identifier constant

```typescript
// mathesar_ui/src/stores/abstract-types/constants.ts
export const abstractTypeCategory = {
  // ... existing types ...
  User: 'user',
} as const;
```

**Step 2**: Register in type map

```typescript
// mathesar_ui/src/stores/abstract-types/abstractTypeCategories.ts
import User from './type-configs/user/user';

const simpleAbstractTypeCategories: AbstractTypeConfigurationPartialMap = {
  // ... existing types ...
  [abstractTypeCategory.User]: User,
};
```

**Step 3**: Handle type identification (for metadata-dependent types)

```typescript
// For types that share DB types but differ by metadata
const userAbstractType: AbstractType = {
  identifier: 'user',
  name: 'User',
  dbTypes: new Set([DB_TYPES.INTEGER]),
  ...User,
};

function isUserAbstractType(dbType: DbType, metadata: ColumnMetadata | null) {
  return metadata?.user_type === true && dbType === DB_TYPES.INTEGER;
}

function identifyAbstractTypeForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType | undefined {
  if (isUserAbstractType(dbType, metadata)) {
    return userAbstractType;
  }
  // ... check other types ...
}
```

**Step 4**: Include in new column options

```typescript
export function getAllowedAbstractTypesForNewColumn() {
  return [...abstractTypesMap.values(), fileAbstractType, userAbstractType]
    .filter((type) => !comboAbstractTypeCategories[type.identifier])
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

#### 6. Cell Data Type Registration

**Location**: `mathesar_ui/src/components/cell-fabric/data-types/index.ts`

Register your cell component factory:

```typescript
import user from './user';

const simpleDataTypeComponentFactories: Record<
  SimpleCellDataTypes,
  CellComponentFactory
> = {
  // ... existing types ...
  user,
};
```

And update the type definitions:

```typescript
// mathesar_ui/src/components/cell-fabric/data-types/typeDefinitions.ts
export type SimpleCellDataTypes =
  | 'string'
  | 'boolean'
  // ... other types ...
  | 'user';
```

---

## Step-by-Step Implementation Guide

This section provides a procedural guide for implementing a new type from scratch.

### Step 1: Backend - Define Column Metadata

**Goal**: Add metadata fields to store type-specific configuration.

1. **Edit the model**: Add fields to `ColumnMetaData` in `mathesar/models/base.py`:

   ```python
   class ColumnMetaData(BaseModel):
       # ... existing fields ...

       # Your new type fields
       mytype_enabled = models.BooleanField(default=False, null=True)
       mytype_option = models.CharField(max_length=50, null=True)
   ```

2. **Create a migration**:

   ```bash
   docker exec mathesar_service_dev python manage.py makemigrations
   ```

   Or create manually in `mathesar/migrations/`:

   ```python
   # XXXX_columnmetadata_mytype.py
   operations = [
       migrations.AddField(
           model_name="columnmetadata",
           name="mytype_enabled",
           field=models.BooleanField(default=False, null=True),
       ),
   ]
   ```

3. **Run the migration**:
   ```bash
   docker exec mathesar_service_dev python manage.py migrate
   ```

**Decision Points**:

- Use `null=True` for optional fields
- Use `choices` for enumerated values
- Add `CheckConstraint` for complex validation
- Consider default values carefully (they affect existing data)

### Step 2: Backend - RPC Metadata Layer

**Goal**: Expose metadata to the frontend via RPC.

1. **Update TypedDicts** in `mathesar/rpc/columns/metadata.py`:

   ```python
   class ColumnMetaDataRecord(TypedDict):
       # ... existing fields ...
       mytype_enabled: Optional[bool]
       mytype_option: Optional[str]

   class ColumnMetaDataBlob(TypedDict):
       # ... existing fields ...
       mytype_enabled: Optional[bool]
       mytype_option: Optional[str]
   ```

2. **Update serialization methods**:
   ```python
   @classmethod
   def from_model(cls, model):
       return cls(
           # ... existing fields ...
           mytype_enabled=model.mytype_enabled,
           mytype_option=model.mytype_option,
       )
   ```

The existing RPC methods (`columns.metadata.list` and `columns.metadata.set`) will automatically handle your new fields.

### Step 3: Backend - Type-Specific Utilities (Optional)

**Goal**: Implement special behaviors like display value computation or auto-population.

Create a new utility module if needed:

```python
# mathesar/utils/mytype_utils.py

def get_mytype_display_values(
    table_oid: int,
    database_id: int,
    column_attnum: int,
    raw_values: set[Any]
) -> dict[str, str]:
    """
    Convert raw values to display strings.
    Returns a mapping of value -> display_string
    """
    # Your implementation
    pass
```

**When to create utilities**:

- Display value computation (like User type)
- Auto-population logic (like "last edited by")
- Complex validation or transformation
- Integration with external systems

### Step 4: Backend - Record Processing (Optional)

**Goal**: Augment record responses with computed values.

If your type needs display values:

1. **Create an augmentation function** in `mathesar/rpc/records.py`:

   ```python
   def _add_mytype_display_values_to_record_info(
       record_info: dict,
       table_oid: int,
       database_id: int,
   ) -> None:
       """Add display values to linked_record_summaries"""
       # Detect columns of your type
       mytype_columns = get_mytype_columns_for_table(table_oid, database_id)

       for column_attnum in mytype_columns:
           # Extract values
           values = {record.get(str(column_attnum)) for record in results}

           # Get display values
           display_values = get_mytype_display_values(...)

           # Add to linked_record_summaries
           record_info["linked_record_summaries"][str(column_attnum)] = display_values
   ```

2. **Call from RPC methods**:
   ```python
   @mathesar_rpc_method(name="records.list", auth="login")
   def list_(...):
       # ... fetch records ...
       _add_mytype_display_values_to_record_info(record_info, table_oid, database_id)
       return RecordList.from_dict(record_info)
   ```

The `linked_record_summaries` structure is a dict of dicts:

```python
{
  "column_attnum": {
    "raw_value": "display_string",
    "raw_value2": "display_string2",
  }
}
```

### Step 5: Frontend - Type Configuration

**Goal**: Define the abstract type configuration.

1. **Create type config directory**:

   ```
   mathesar_ui/src/stores/abstract-types/type-configs/mytype/
   ```

2. **Create type configuration file** (`mytype.ts`):

   ```typescript
   import type { AbstractTypeConfiguration } from '../../types';
   import { DB_TYPES } from '../../dbTypes';
   import { iconMyType } from '@mathesar/icons';

   const myType: AbstractTypeConfiguration = {
     getIcon: () => ({ ...iconMyType, label: 'My Type' }),
     defaultDbType: DB_TYPES.TEXT, // or whatever is appropriate
     cellInfo: {
       type: 'mytype',
     },
   };

   export default myType;
   ```

3. **Add database options form** (if needed):

   ```typescript
   const dbForm: AbstractTypeConfigForm = {
     variables: {
       myOption: {
         type: 'string',
         default: 'value1',
       },
     },
     layout: {
       orientation: 'vertical',
       elements: [
         {
           type: 'input',
           variable: 'myOption',
           label: 'My Option',
         },
       ],
     },
   };

   function determineDbTypeAndOptions(
     dbFormValues: FormValues,
     columnType: DbType,
   ): { dbType: DbType; typeOptions: Record<string, unknown> } {
     return {
       dbType: columnType,
       typeOptions: {
         // Convert form values to type_options if needed
       },
     };
   }

   function constructDbFormValuesFromTypeOptions(
     columnType: DbType,
     typeOptions: RawColumnWithMetadata['type_options'],
   ): FormValues {
     return {
       myOption: typeOptions.myOption ?? 'value1',
     };
   }

   // Add to type configuration
   const myType: AbstractTypeConfiguration = {
     // ... previous fields ...
     getDbConfig: (): AbstractTypeDbConfig => ({
       form: dbForm,
       determineDbTypeAndOptions,
       constructDbFormValuesFromTypeOptions,
     }),
   };
   ```

4. **Add display options form** (if needed):

   ```typescript
   const displayForm: AbstractTypeConfigForm = {
     variables: {
       displayFormat: {
         type: 'string',
         enum: ['short', 'long'],
         default: 'short',
       },
     },
     layout: {
       orientation: 'vertical',
       elements: [
         {
           type: 'input',
           variable: 'displayFormat',
           label: 'Display Format',
           options: {
             short: { label: 'Short' },
             long: { label: 'Long' },
           },
         },
       ],
     },
   };

   function determineDisplayOptions(
     formValues: FormValues,
   ): RawColumnWithMetadata['metadata'] {
     return {
       mytype_display_format: formValues.displayFormat as 'short' | 'long',
     };
   }

   function constructDisplayFormValuesFromDisplayOptions(
     metadata: RawColumnWithMetadata['metadata'],
   ): FormValues {
     return {
       displayFormat:
         getColumnMetadataValue(metadata, 'mytype_display_format') ?? 'short',
     };
   }

   // Add to type configuration
   const myType: AbstractTypeConfiguration = {
     // ... previous fields ...
     getDisplayConfig: (): AbstractTypeDisplayConfig => ({
       form: displayForm,
       determineDisplayOptions,
       constructDisplayFormValuesFromDisplayOptions,
     }),
   };
   ```

**Metadata synchronization**: If you need to sync database options to metadata (like the User type does with `lastEditedBy`), handle it in `AbstractTypeControl.svelte` or update the metadata in `determineDbTypeAndOptions`.

### Step 6: Frontend - Cell Components

**Goal**: Create components for displaying and editing cells.

1. **Create component directory**:

   ```
   mathesar_ui/src/components/cell-fabric/data-types/components/mytype/
   ```

2. **Create display component** (`MyTypeCell.svelte`):

   ```svelte
   <script lang="ts">
     import CellWrapper from '../CellWrapper.svelte';
     import type { CellExternalProps } from '../typeDefinitions';

     export let value: CellExternalProps['value'] = undefined;
     export let isActive: CellExternalProps['isActive'];
     export let disabled: CellExternalProps['disabled'];
     // ... other props as needed

     $: displayValue = formatValue(value);

     function formatValue(val: unknown): string {
       // Format the value for display
       return String(val ?? '');
     }
   </script>

   <CellWrapper {isActive} {disabled}>
     <span class="mytype-display">{displayValue}</span>
   </CellWrapper>
   ```

3. **Create input component** (`MyTypeInput.svelte`):

   ```svelte
   <script lang="ts">
     import { createEventDispatcher } from 'svelte';
     import type { CellExternalProps } from '../typeDefinitions';

     const dispatch = createEventDispatcher();

     export let value: CellExternalProps['value'] = undefined;
     export let disabled: CellExternalProps['disabled'];

     let inputValue = value ?? '';

     function handleChange() {
       dispatch('update', inputValue);
     }
   </script>

   <input
     type="text"
     bind:value={inputValue}
     on:change={handleChange}
     {disabled}
   />
   ```

4. **Create cell component factory** (`mytype.ts`):

   ```typescript
   import type { CellComponentFactory } from './typeDefinitions';
   import MyTypeCell from './components/mytype/MyTypeCell.svelte';
   import MyTypeInput from './components/mytype/MyTypeInput.svelte';

   const myType: CellComponentFactory = {
     initialInputValue: null,

     get: (column) => ({
       component: MyTypeCell,
       props: {
         // Pass metadata or other config
       },
     }),

     getInput: (column) => ({
       component: MyTypeInput,
       props: {
         // Pass metadata or other config
       },
     }),

     getDisplayFormatter: () => (value) => String(value ?? ''),
   };

   export default myType;
   ```

**Component best practices**:

- Use `CellWrapper` for consistent styling and behavior
- Support keyboard navigation (Enter to edit, Escape to cancel)
- Handle loading states and errors
- Use `recordSummary` prop for display values from `linked_record_summaries`
- Emit `update` event when value changes

### Step 7: Frontend - Type Registration

**Goal**: Register the type with the system.

1. **Add type identifier** to `mathesar_ui/src/stores/abstract-types/constants.ts`:

   ```typescript
   export const abstractTypeCategory = {
     // ... existing ...
     MyType: 'mytype',
   } as const;
   ```

2. **Import and register** in `mathesar_ui/src/stores/abstract-types/abstractTypeCategories.ts`:

   ```typescript
   import MyType from './type-configs/mytype/mytype';

   const simpleAbstractTypeCategories: AbstractTypeConfigurationPartialMap = {
     // ... existing ...
     [abstractTypeCategory.MyType]: MyType,
   };
   ```

3. **For metadata-dependent types**, add identification logic:

   ```typescript
   const myTypeAbstractType: AbstractType = {
     identifier: 'mytype',
     name: 'My Type',
     dbTypes: new Set([DB_TYPES.TEXT]),
     ...MyType,
   };

   function isMyTypeAbstractType(
     dbType: DbType,
     metadata: ColumnMetadata | null,
   ) {
     return metadata?.mytype_enabled === true && dbType === DB_TYPES.TEXT;
   }

   function identifyAbstractTypeForDbType(
     dbType: DbType,
     metadata: ColumnMetadata | null,
   ): AbstractType | undefined {
     if (isMyTypeAbstractType(dbType, metadata)) {
       return myTypeAbstractType;
     }
     // ... existing checks ...
   }
   ```

4. **Include in available types**:
   ```typescript
   export function getAllowedAbstractTypesForNewColumn() {
     return [
       ...abstractTypesMap.values(),
       fileAbstractType,
       userAbstractType,
       myTypeAbstractType,
     ]
       .filter((type) => !comboAbstractTypeCategories[type.identifier])
       .sort((a, b) => a.name.localeCompare(b.name));
   }
   ```

### Step 8: Frontend - Cell Data Type Registration

**Goal**: Connect cell components to the rendering system.

1. **Add to type definition** in `mathesar_ui/src/components/cell-fabric/data-types/typeDefinitions.ts`:

   ```typescript
   export type SimpleCellDataTypes =
     | 'string'
     | 'boolean'
     // ... other types ...
     | 'mytype';
   ```

2. **Register factory** in `mathesar_ui/src/components/cell-fabric/data-types/index.ts`:

   ```typescript
   import mytype from './mytype';

   const simpleDataTypeComponentFactories: Record<
     SimpleCellDataTypes,
     CellComponentFactory
   > = {
     // ... existing ...
     mytype,
   };
   ```

### Step 9: Testing

1. **Create a test table** with your new type
2. **Test type creation**: Create a column with your type
3. **Test display**: View records in the table
4. **Test editing**: Add and edit values
5. **Test type options**: Configure database and display options
6. **Test type conversion**: Convert from/to other types
7. **Test filtering**: Filter records by your type (if supported)

---

## Advanced Topics

### Metadata-Dependent Type Identification

Some types share database types but are distinguished by metadata. This is true for:

- **File type**: Uses `JSONB`, identified by `file_backend` metadata
- **User type**: Uses `INTEGER`, identified by `user_type` metadata

**Implementation pattern**:

```typescript
// Define the type outside the main map
const specialAbstractType: AbstractType = {
  identifier: 'special',
  name: 'Special',
  dbTypes: new Set([DB_TYPES.INTEGER]),
  ...SpecialTypeConfig,
};

// Create identification function
function isSpecialAbstractType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
) {
  return metadata?.special_enabled === true && dbType === DB_TYPES.INTEGER;
}

// Use in identification logic
function identifyAbstractTypeForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType | undefined {
  // Check metadata-dependent types first
  if (isSpecialAbstractType(dbType, metadata)) {
    return specialAbstractType;
  }

  // Then check standard type map
  for (const [, abstractType] of abstractTypesMap) {
    if (abstractType.dbTypes.has(dbType)) {
      return abstractType;
    }
  }

  return undefined;
}
```

**When to use this pattern**:

- Your type needs to coexist with other types using the same DB type
- The type is identified by presence of specific metadata
- You want fine-grained control over type identification

**Trade-offs**:

- More complex type identification logic
- Requires metadata to be set correctly
- Need to handle type conversion carefully (metadata cleanup)

### Form Configuration System

Forms allow users to configure types when creating or editing columns. The system supports:

#### Form Structure

```typescript
interface AbstractTypeConfigForm {
  variables: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean';
      enum?: string[]; // For dropdown options
      default: unknown;
    };
  };
  layout: {
    orientation: 'vertical' | 'horizontal';
    elements: Array<{
      type: 'input';
      variable: string;
      label: string;
      options?: Record<string, { label: string }>; // For enums
    }>;
  };
}
```

#### Bidirectional Conversion

Forms require two-way conversion between form values and stored data:

**For database options**:

- `determineDbTypeAndOptions`: FormValues → { dbType, typeOptions }
- `constructDbFormValuesFromTypeOptions`: typeOptions → FormValues

**For display options**:

- `determineDisplayOptions`: FormValues → metadata
- `constructDisplayFormValuesFromDisplayOptions`: metadata → FormValues

Example:

```typescript
// Save direction: form → metadata
function determineDisplayOptions(formValues: FormValues): ColumnMetadata {
  return {
    mytype_format: formValues.format as 'short' | 'long',
    mytype_precision: formValues.precision as number,
  };
}

// Load direction: metadata → form
function constructDisplayFormValuesFromDisplayOptions(
  metadata: ColumnMetadata,
): FormValues {
  return {
    format: metadata.mytype_format ?? 'short',
    precision: metadata.mytype_precision ?? 2,
  };
}
```

#### Form Value Watching

Sometimes you need to update metadata when form values change. Use reactive statements in `AbstractTypeControl.svelte`:

```typescript
// Special handling: sync form values to metadata
$: if (
  selectedAbstractType?.identifier === 'mytype' &&
  dbFormValues &&
  'myOption' in $dbFormValues
) {
  metadata = {
    ...metadata,
    mytype_option: $dbFormValues.myOption as string,
  };
}
```

This is used by the User type to sync the `lastEditedBy` checkbox to `user_last_edited_by` metadata.

### Display Value Augmentation

Display values provide human-readable representations of raw data. For example:

- User ID `42` displays as "John Doe"
- File hash displays as "document.pdf"

**Backend pattern**:

1. **Identify columns** that need display values
2. **Extract raw values** from record results
3. **Compute display values** (fetch from database, transform, etc.)
4. **Add to `linked_record_summaries`** in the response

```python
def _add_display_values_to_record_info(
    record_info: dict,
    table_oid: int,
    database_id: int,
) -> None:
    # 1. Identify columns
    special_columns = get_special_columns_for_table(table_oid, database_id)

    # 2. Extract values
    results = record_info.get("results", [])
    for column_attnum in special_columns:
        raw_values = {record.get(str(column_attnum)) for record in results}

        # 3. Compute display values
        display_values = compute_display_values(raw_values, ...)

        # 4. Add to response
        if "linked_record_summaries" not in record_info:
            record_info["linked_record_summaries"] = {}
        record_info["linked_record_summaries"][str(column_attnum)] = display_values
```

**Frontend pattern**:

Cell components receive display values via the `recordSummary` prop:

```svelte
<script lang="ts">
  export let value: number | null = null;
  export let recordSummary: string | undefined = undefined;

  $: displayText = recordSummary ?? String(value ?? '');
</script>

<span>{displayText}</span>
```

The `recordSummary` prop is automatically populated from `linked_record_summaries[column_attnum][value]`.

**When to use display values**:

- Raw value is not human-readable (IDs, hashes, codes)
- Display requires external data (user names, file names)
- Display depends on metadata configuration

### Auto-Population and Special Behaviors

Some types have special behaviors beyond display and editing.

#### Auto-Population Example: "Last Edited By"

The User type supports auto-setting the column to the current user's ID when records are modified.

**Backend implementation**:

```python
def _set_last_edited_by_columns(
    record_def: dict,
    table_oid: int,
    database_id: int,
    user_id: int,
) -> None:
    """Automatically set user_last_edited_by columns to current user ID"""
    last_edited_by_columns = get_last_edited_by_columns_for_table(
        table_oid, database_id
    )
    for column_attnum in last_edited_by_columns:
        record_def[str(column_attnum)] = user_id

# Call before saving/updating records
@mathesar_rpc_method(name="records.add", auth="login")
def add(*, record_def: dict, table_oid: int, database_id: int, **kwargs):
    user = kwargs.get(REQUEST_KEY).user
    _set_last_edited_by_columns(record_def, table_oid, database_id, user.id)
    # ... continue with save ...
```

**Frontend considerations**:

- Make the column non-editable when auto-population is enabled
- Show clear indication that the value is automatic
- Consider hiding from forms entirely

#### Custom Validation

Implement validation in form configuration or cell components:

```typescript
// In form configuration
const dbForm: AbstractTypeConfigForm = {
  variables: {
    maxLength: {
      type: 'number',
      default: 100,
      // Validation can be added via the form system
    },
  },
  // ...
};

// In cell component
function validateValue(value: unknown): boolean {
  // Custom validation logic
  if (typeof value !== 'string') return false;
  if (value.length > maxLength) return false;
  return true;
}
```

### Type Conversion and Metadata Cleanup

When users change a column's type, metadata must be updated accordingly.

**Implementation** in `abstractTypeCategories.ts`:

```typescript
export function mergeMetadataOnTypeChange(
  newAbstractType: AbstractType,
  metadata: ColumnMetadata | null,
) {
  let result = metadata ?? {};

  // Set metadata for new type
  if (newAbstractType.identifier === 'mytype') {
    result = {
      ...result,
      mytype_enabled: true,
      mytype_option: result.mytype_option ?? 'default',
    };
  } else {
    // Clear metadata when changing away from mytype
    const { mytype_enabled, mytype_option, ...rest } = result;
    result = {
      ...rest,
      mytype_enabled: null,
      mytype_option: null,
    };
  }

  return result;
}
```

**Guidelines**:

- Set new type's metadata when converting TO the type
- Clear old type's metadata when converting AWAY from the type
- Use `null` for nullable fields (not `undefined`)
- Preserve unrelated metadata
- Handle NOT NULL constraints carefully (delete the field instead of setting to null)

---

## Complete Example: User Type

Let's walk through the complete User type implementation as a reference.

### Overview

The User type allows columns to store references to Mathesar users (Django User model). It provides:

- User selection dropdown in cells
- Configurable display (show full name, email, or username)
- "Last edited by" auto-population
- Integration with user management system

### Backend Files

#### 1. Migration: `mathesar/migrations/0010_columnmetadata_user_type.py`

```python
operations = [
    migrations.AddField(
        model_name="columnmetadata",
        name="user_type",
        field=models.BooleanField(default=False, null=True),
    ),
    migrations.AddField(
        model_name="columnmetadata",
        name="user_display_field",
        field=models.CharField(
            choices=[
                ("full_name", "full_name"),
                ("email", "email"),
                ("username", "username"),
            ],
            default="full_name",
            max_length=50,
            null=False,
        ),
    ),
    migrations.AddField(
        model_name="columnmetadata",
        name="user_last_edited_by",
        field=models.BooleanField(default=False, null=True),
    ),
]
```

**Design decisions**:

- `user_type`: Boolean flag to identify user columns
- `user_display_field`: NOT NULL with default (always has a value)
- `user_last_edited_by`: Optional feature, nullable

#### 2. Model: `mathesar/models/base.py`

```python
class ColumnMetaData(BaseModel):
    # ... existing fields ...
    user_type = models.BooleanField(default=False, null=True)
    user_display_field = models.CharField(
        choices=[("full_name", "full_name"), ("email", "email"), ("username", "username")],
        default="full_name",
        max_length=50,
        null=False
    )
    user_last_edited_by = models.BooleanField(default=False, null=True)
```

#### 3. RPC Metadata: `mathesar/rpc/columns/metadata.py`

```python
class ColumnMetaDataRecord(TypedDict):
    # ... existing fields ...
    user_type: Optional[bool]
    user_display_field: Literal["full_name", "email", "username"]
    user_last_edited_by: Optional[bool]

class ColumnMetaDataBlob(TypedDict):
    # ... existing fields ...
    user_type: Optional[bool]
    user_display_field: Optional[Literal["full_name", "email", "username"]]
    user_last_edited_by: Optional[bool]
```

#### 4. Utilities: `mathesar/utils/user_display.py`

```python
def get_user_display_values_for_column(
    table_oid: int,
    database_id: int,
    column_attnum: int,
    user_ids: set[Optional[int]]
) -> dict[str, str]:
    """Fetch display values for user IDs"""
    # Get column metadata to determine display field
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    display_field = "full_name"
    for col_meta in columns_meta_data:
        if col_meta.attnum == column_attnum and col_meta.user_type:
            display_field = col_meta.user_display_field or "full_name"
            break

    # Fetch users in bulk
    users = User.objects.filter(id__in=valid_user_ids)

    # Build display values
    display_values = {}
    for user_id in valid_user_ids:
        user = user_map.get(user_id)
        if user:
            value = getattr(user, display_field, None)
            display_values[str(user_id)] = value or ""

    return display_values

def get_last_edited_by_columns_for_table(table_oid: int, database_id: int) -> list[int]:
    """Get columns with user_last_edited_by enabled"""
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    return [
        c.attnum for c in columns_meta_data
        if c.user_type and c.user_last_edited_by
    ]
```

#### 5. Record Processing: `mathesar/rpc/records.py`

```python
def _add_user_display_values_to_record_info(
    record_info: dict,
    table_oid: int,
    database_id: int,
) -> None:
    """Add user display values to linked_record_summaries"""
    user_column_attnums = get_user_columns_for_table(table_oid, database_id)

    if not user_column_attnums:
        return

    # Ensure linked_record_summaries exists
    if "linked_record_summaries" not in record_info:
        record_info["linked_record_summaries"] = {}

    # Process each user column
    for column_attnum in user_column_attnums:
        # Collect user IDs from results
        user_ids = set()
        for record in record_info.get("results", []):
            user_id = record.get(str(column_attnum))
            if user_id is not None:
                user_ids.add(int(user_id))

        # Get display values
        user_display_values = get_user_display_values_for_column(
            table_oid, database_id, column_attnum, user_ids
        )

        # Add to response
        record_info["linked_record_summaries"][str(column_attnum)] = user_display_values

def _set_last_edited_by_columns(
    record_def: dict,
    table_oid: int,
    database_id: int,
    user_id: int,
) -> None:
    """Auto-set user_last_edited_by columns"""
    last_edited_by_columns = get_last_edited_by_columns_for_table(
        table_oid, database_id
    )
    for column_attnum in last_edited_by_columns:
        record_def[str(column_attnum)] = user_id

# Called from RPC methods
@mathesar_rpc_method(name="records.list", auth="login")
def list_(...):
    # ... fetch records ...
    _add_user_display_values_to_record_info(record_info, table_oid, database_id)
    return RecordList.from_dict(record_info)

@mathesar_rpc_method(name="records.add", auth="login")
def add(*, record_def: dict, ...):
    user = kwargs.get(REQUEST_KEY).user
    _set_last_edited_by_columns(record_def, table_oid, database_id, user.id)
    # ... save record ...
```

### Frontend Files

#### 6. Type Configuration: `mathesar_ui/src/stores/abstract-types/type-configs/user/user.ts`

```typescript
import { iconUser } from '@mathesar/icons';
import { DB_TYPES } from '../../dbTypes';

// Database options form
const dbForm: AbstractTypeConfigForm = {
  variables: {
    lastEditedBy: {
      type: 'boolean',
      default: false,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'lastEditedBy',
        label:
          'Use as "Last edited by" column. Will be set automatically and be non-editable.',
      },
    ],
  },
};

// Display options form
const displayForm: AbstractTypeConfigForm = {
  variables: {
    displayField: {
      type: 'string',
      enum: ['full_name', 'email', 'username'],
      default: 'full_name',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'displayField',
        label: 'Field to represent each user',
        options: {
          full_name: { label: 'Display Name' },
          email: { label: 'Email' },
          username: { label: 'Username' },
        },
      },
    ],
  },
};

const userType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUser, label: 'User' }),
  defaultDbType: DB_TYPES.INTEGER,
  cellInfo: {
    type: 'user',
  },
  getEnabledState: () => ({ enabled: true }),
  getDbConfig: (): AbstractTypeDbConfig => ({
    form: dbForm,
    determineDbTypeAndOptions: (dbFormValues, columnType) => ({
      dbType: columnType,
      typeOptions: {},
    }),
    constructDbFormValuesFromTypeOptions: () => ({
      lastEditedBy: false,
    }),
  }),
  getDisplayConfig: (): AbstractTypeDisplayConfig => ({
    form: displayForm,
    determineDisplayOptions: (formValues) => ({
      user_display_field: formValues.displayField as
        | 'full_name'
        | 'email'
        | 'username',
    }),
    constructDisplayFormValuesFromDisplayOptions: (metadata) => ({
      displayField:
        getColumnMetadataValue(metadata, 'user_display_field') ?? 'full_name',
    }),
  }),
};

export default userType;
```

**Key points**:

- DB options control the "last edited by" feature
- Display options control how users are displayed
- `lastEditedBy` is synced to metadata in `AbstractTypeControl.svelte`

#### 7. Cell Factory: `mathesar_ui/src/components/cell-fabric/data-types/user.ts`

```typescript
import UserCell from './components/user/UserCell.svelte';
import UserInput from './components/user/UserInput.svelte';
import UserFilterInput from './components/user/UserFilterInput.svelte';

const userType: CellComponentFactory = {
  initialInputValue: null,
  get: (column) => ({
    component: UserCell,
    props: {
      userDisplayField: getMetadataValue(column.metadata, 'user_display_field'),
    },
  }),
  getInput: (column) => ({
    component: UserInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'full_name',
    },
  }),
  getSimpleInput: (column) => ({
    component: UserFilterInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'full_name',
    },
  }),
  getDisplayFormatter: () => String,
};
```

#### 8. Cell Component: `UserCell.svelte` (simplified)

```svelte
<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import { AttachableRowSeekerController } from '@mathesar/systems/row-seeker';
  import { getUserLabel } from '@mathesar/utils/userUtils';
  import CellWrapper from '../CellWrapper.svelte';

  export let value: number | null = undefined;
  export let recordSummary: string | undefined = undefined;
  export let disabled: boolean;
  export let userDisplayField: 'full_name' | 'email' | 'username' = 'full_name';

  let users: User[] = [];
  let rowSeekerController = new AttachableRowSeekerController();

  $: displayText = recordSummary ?? (value ? String(value) : '');

  async function loadUsers() {
    users = await api.users.list().run();
  }

  function convertUsersToRecords(users: User[]): RecordsSummaryListResponse {
    return {
      results: users.map((user) => ({
        key: user.id,
        summary: getUserLabel(user, userDisplayField),
      })),
      count: users.length,
    };
  }

  function handleSelect(userId: number) {
    dispatch('update', userId);
  }
</script>

<CellWrapper {isActive} {disabled}>
  {#if isActive && !disabled}
    <AttachableRowSeeker
      controller={rowSeekerController}
      on:select={handleSelect}
      fetchRecords={() => convertUsersToRecords(users)}
    />
  {:else}
    <LinkedRecord summary={displayText} />
  {/if}
</CellWrapper>
```

**Component features**:

- Uses `AttachableRowSeeker` for user selection
- Shows `recordSummary` (from backend) when available
- Respects `userDisplayField` metadata
- Integrates with existing UI patterns

#### 9. Registration: `mathesar_ui/src/stores/abstract-types/abstractTypeCategories.ts`

```typescript
import User from './type-configs/user/user';

// Add to constants
export const abstractTypeCategory = {
  // ... existing ...
  User: 'user',
};

// Register in simple types
const simpleAbstractTypeCategories: AbstractTypeConfigurationPartialMap = {
  // ... existing ...
  [abstractTypeCategory.User]: User,
};

// Define separate type (shares INTEGER with Number type)
const userAbstractType: AbstractType = {
  identifier: 'user',
  name: 'User',
  dbTypes: new Set([DB_TYPES.INTEGER]),
  ...User,
};

// Type identification
function isUserAbstractType(dbType: DbType, metadata: ColumnMetadata | null) {
  return metadata?.user_type === true && dbType === DB_TYPES.INTEGER;
}

function identifyAbstractTypeForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType | undefined {
  // Check metadata-dependent types first
  if (isUserAbstractType(dbType, metadata)) {
    return userAbstractType;
  }
  // ... other checks ...
}

// Include in new column options
export function getAllowedAbstractTypesForNewColumn() {
  return [...abstractTypesMap.values(), fileAbstractType, userAbstractType]
    .filter((type) => !comboAbstractTypeCategories[type.identifier])
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Metadata handling on type change
export function mergeMetadataOnTypeChange(
  newAbstractType: AbstractType,
  metadata: ColumnMetadata | null,
) {
  let result = metadata ?? {};

  if (newAbstractType.identifier === 'user') {
    result = {
      ...result,
      user_type: true,
      user_display_field: result.user_display_field ?? 'full_name',
      user_last_edited_by: result.user_last_edited_by ?? false,
    };
  } else {
    // Clear user metadata when changing away
    const { user_type, user_display_field, user_last_edited_by, ...rest } =
      result;
    result = {
      ...rest,
      user_type: null,
      user_last_edited_by: null,
    };
    // Delete user_display_field (NOT NULL constraint)
    delete (result as Record<string, unknown>).user_display_field;
  }

  return result;
}
```

### Data Flow

1. **User creates a User column**:

   - Frontend: User selects "User" type in type selector
   - Frontend: Sets `user_type: true` in metadata
   - Frontend: Calls `columns.add` RPC with type=INTEGER and metadata
   - Backend: Stores column with metadata in `ColumnMetaData` table

2. **User views table with User column**:

   - Frontend: Calls `records.list` RPC
   - Backend: Fetches records from PostgreSQL (raw user IDs)
   - Backend: Detects user columns via `get_user_columns_for_table`
   - Backend: Fetches user display values from Django User model
   - Backend: Adds display values to `linked_record_summaries`
   - Frontend: Receives records with display values
   - Frontend: `UserCell` component displays `recordSummary` prop

3. **User edits a User cell**:
   - Frontend: `UserCell` activates, shows `AttachableRowSeeker`
   - Frontend: Loads list of users via `api.users.list()`
   - Frontend: User selects from list
   - Frontend: Emits `update` event with user ID
   - Frontend: Calls `records.patch` RPC with new value
   - Backend: If `user_last_edited_by` is enabled, auto-sets current user
   - Backend: Saves record

### Key Design Decisions

1. **Why INTEGER instead of custom type?**

   - Leverages existing foreign key capabilities
   - Simple storage and indexing
   - Identified by metadata flag

2. **Why `user_display_field` is NOT NULL?**

   - Always needs a display strategy
   - Simpler logic (no null checking)
   - Default value ensures reasonable behavior

3. **Why separate `lastEditedBy` from main type identifier?**

   - Same type, different behavior
   - User can have both manual and automatic user columns
   - Flexibility in usage

4. **Why use `linked_record_summaries`?**
   - Consistent with foreign key display pattern
   - Efficient (one query for all user IDs)
   - Frontend doesn't need to fetch separately

---

## Testing Considerations

### Backend Testing

**Test metadata persistence**:

```python
def test_user_type_metadata_persistence():
    """Test that user type metadata is saved and retrieved correctly"""
    column_meta = ColumnMetaData.objects.create(
        database=db,
        table_oid=12345,
        attnum=1,
        user_type=True,
        user_display_field='email',
        user_last_edited_by=False,
    )

    retrieved = ColumnMetaData.objects.get(
        database=db, table_oid=12345, attnum=1
    )

    assert retrieved.user_type is True
    assert retrieved.user_display_field == 'email'
    assert retrieved.user_last_edited_by is False
```

**Test RPC endpoints**:

```python
def test_metadata_rpc_includes_user_fields():
    """Test that RPC endpoints expose user type fields"""
    response = api.columns.metadata.list(
        table_oid=12345,
        database_id=1,
    )

    assert 'user_type' in response[0]
    assert 'user_display_field' in response[0]
```

**Test display value generation**:

```python
def test_user_display_values():
    """Test that display values are generated correctly"""
    user1 = User.objects.create(username='alice', full_name='Alice Smith')
    user2 = User.objects.create(username='bob', full_name='Bob Jones')

    display_values = get_user_display_values_for_column(
        table_oid=12345,
        database_id=1,
        column_attnum=1,
        user_ids={user1.id, user2.id}
    )

    assert display_values[str(user1.id)] == 'Alice Smith'
    assert display_values[str(user2.id)] == 'Bob Jones'
```

### Frontend Testing

**Test type registration**:

```typescript
test('User type is registered in type system', () => {
  const userType = abstractTypesMap.get('user');
  expect(userType).toBeDefined();
  expect(userType?.name).toBe('User');
});
```

**Test type identification**:

```typescript
test('User type is identified by metadata', () => {
  const type = getAbstractTypeForDbType(DB_TYPES.INTEGER, { user_type: true });
  expect(type.identifier).toBe('user');
});

test('INTEGER without user_type is Number type', () => {
  const type = getAbstractTypeForDbType(DB_TYPES.INTEGER, null);
  expect(type.identifier).toBe('number');
});
```

**Test cell component rendering**:

```typescript
test('UserCell displays recordSummary', () => {
  const { getByText } = render(UserCell, {
    props: {
      value: 42,
      recordSummary: 'John Doe',
      userDisplayField: 'full_name',
    },
  });

  expect(getByText('John Doe')).toBeInTheDocument();
});
```

**Test form configuration**:

```typescript
test('Display form constructs values from metadata', () => {
  const metadata = { user_display_field: 'email' };
  const config = userType.getDisplayConfig!();
  const formValues =
    config.constructDisplayFormValuesFromDisplayOptions(metadata);

  expect(formValues.displayField).toBe('email');
});
```

### Integration Testing

**Test complete workflow**:

1. Create a table with a User column
2. Add records with user values
3. Verify display values appear correctly
4. Edit a user value
5. Verify "last edited by" auto-population (if enabled)
6. Change column type away from User
7. Verify metadata is cleaned up
8. Change back to User type
9. Verify metadata is restored with defaults

---

## Common Patterns and Best Practices

### When to Use Metadata vs Type Options

**Use Metadata when**:

- Configuration affects display/behavior in the UI
- Setting is Mathesar-specific (not a PostgreSQL concept)
- Value needs to be accessed frequently with column info
- Examples: display format, UI hints, special behaviors

**Use Type Options when**:

- Configuration affects the database type itself
- Setting maps to PostgreSQL type parameters
- Value is used in type casting or constraints
- Examples: precision, scale, length constraints

**Hybrid approach** (like User type):

- Use metadata for type identification and UI config
- Use type_options if the underlying DB type needs parameters

### Naming Conventions

**Metadata fields**:

- Prefix with type identifier: `user_type`, `user_display_field`
- Use snake_case (Django convention)
- Boolean flags: `[type]_enabled`, `[type]_[feature]`
- Options: `[type]_[setting]`

**Frontend identifiers**:

- Use camelCase for JavaScript/TypeScript
- Match backend names when possible: `user_display_field` → `userDisplayField`
- Cell data types: lowercase, match metadata patterns

**Type identifiers**:

- Lowercase, descriptive: `user`, `file`, `email`
- Match between frontend and backend
- Use in URLs, storage keys, etc.

### Form Configuration Patterns

**Simple option selection**:

```typescript
{
  variables: {
    option: {
      type: 'string',
      enum: ['value1', 'value2', 'value3'],
      default: 'value1',
    },
  },
  layout: {
    elements: [{
      type: 'input',
      variable: 'option',
      label: 'Select Option',
      options: {
        value1: { label: 'First Option' },
        value2: { label: 'Second Option' },
        value3: { label: 'Third Option' },
      },
    }],
  },
}
```

**Boolean toggle**:

```typescript
{
  variables: {
    enabled: {
      type: 'boolean',
      default: false,
    },
  },
  layout: {
    elements: [{
      type: 'input',
      variable: 'enabled',
      label: 'Enable feature',
    }],
  },
}
```

**Numeric input**:

```typescript
{
  variables: {
    precision: {
      type: 'number',
      default: 2,
    },
  },
  layout: {
    elements: [{
      type: 'input',
      variable: 'precision',
      label: 'Decimal places',
    }],
  },
}
```

### Component Composition Strategies

**Use existing patterns**:

- `CellWrapper`: Standard cell styling and behavior
- `LinkedRecord`: Display linked/referenced data
- `AttachableRowSeeker`: Record selection interface
- `Null`: Display null values consistently

**Component props pattern**:

```typescript
export let value: unknown = undefined; // The cell value
export let isActive: boolean; // Is cell being edited?
export let disabled: boolean; // Is cell read-only?
export let recordSummary: string | undefined; // Display value from backend
export let searchValue: unknown = undefined; // Value being searched for
export let [typeSpecificProp]: ConfigType; // Type-specific configuration
```

**Event handling**:

```typescript
const dispatch = createEventDispatcher();

function handleUpdate(newValue: unknown) {
  dispatch('update', newValue); // Emit update event
}
```

### Performance Considerations

**Bulk operations**:

- Fetch display values for all records at once (not one by one)
- Use `linked_record_summaries` structure
- Cache user lists, reference data, etc.

**Lazy loading**:

- Load type-specific data only when needed
- Use `onMount` for expensive operations
- Consider pagination for large datasets

**Reactive updates**:

- Use Svelte reactivity efficiently
- Avoid unnecessary re-renders
- Memoize expensive computations

**Example** (from UserCell):

```svelte
<script lang="ts">
  let users: User[] = [];
  let isLoadingUsers = false;

  // Lazy load - only when dropdown is opened
  async function loadUsers() {
    if (users.length > 0) return; // Already loaded
    try {
      isLoadingUsers = true;
      users = await api.users.list().run();
    } finally {
      isLoadingUsers = false;
    }
  }

  // Memoized display value
  $: displayText = recordSummary ?? (value ? String(value) : '');
</script>
```

---

## Troubleshooting Guide

### Type Not Appearing in Type Selector

**Symptom**: Your new type doesn't show up when creating/editing columns.

**Possible causes**:

1. Type not registered in `simpleAbstractTypeCategories`
2. Type not included in `getAllowedAbstractTypesForNewColumn`
3. `getEnabledState` returns `{ enabled: false }`
4. Frontend not recompiled after changes

**Solutions**:

- Verify import statement in `abstractTypeCategories.ts`
- Check registration in `simpleAbstractTypeCategories` map
- Ensure `getAllowedAbstractTypesForNewColumn` includes your type
- Check `getEnabledState` implementation
- Rebuild frontend: `docker-compose restart dev-service`

### Metadata Not Persisting

**Symptom**: Metadata values are not saved or retrieved correctly.

**Possible causes**:

1. Migration not run
2. Field not added to `ColumnMetaDataRecord`/`ColumnMetaDataBlob`
3. Serialization methods not updated
4. Field name mismatch between model and TypedDict

**Solutions**:

- Run migrations: `python manage.py migrate`
- Check field exists in database: `\d+ mathesar_columnmetadata`
- Verify `from_model` method includes your field
- Ensure field names match exactly (case-sensitive)
- Test RPC endpoint: `api.columns.metadata.list()`

### Display Values Not Showing

**Symptom**: Raw values display instead of computed display values.

**Possible causes**:

1. Display value augmentation not called in RPC method
2. `linked_record_summaries` key doesn't match column attnum
3. Column not detected as user type
4. Component not using `recordSummary` prop

**Solutions**:

- Add `_add_[type]_display_values_to_record_info` call to RPC methods
- Verify key is string: `str(column_attnum)`
- Check type identification logic
- Ensure cell component uses `recordSummary` prop:
  ```svelte
  $: displayText = recordSummary ?? String(value ?? '');
  ```

### Form Validation Errors

**Symptom**: Form shows errors or won't save.

**Possible causes**:

1. Form configuration mismatch
2. Validation failing silently
3. Type conversion issues
4. Missing required fields

**Solutions**:

- Check form variable types match usage
- Verify `determineDisplayOptions` returns correct metadata structure
- Test form values with console.log
- Ensure all required metadata fields have defaults

### Type Identification Issues

**Symptom**: Wrong type shown for column, or type switching doesn't work.

**Possible causes**:

1. Metadata-dependent type checked in wrong order
2. Identification function logic error
3. Metadata not cleared when changing types
4. Multiple types claiming same DB type

**Solutions**:

- Check metadata-dependent types BEFORE standard type map
- Verify identification logic:
  ```typescript
  if (isUserAbstractType(dbType, metadata)) {
    return userAbstractType;
  }
  ```
- Implement `mergeMetadataOnTypeChange` correctly
- Ensure metadata flags are mutually exclusive

### Cell Component Not Rendering

**Symptom**: Cells show errors or render incorrectly.

**Possible causes**:

1. Cell data type not registered
2. Component import/export issues
3. Props mismatch
4. Missing dependencies

**Solutions**:

- Register in `simpleDataTypeComponentFactories`
- Add to `SimpleCellDataTypes` type union
- Check component exports: `export default userType;`
- Verify props match `CellExternalProps` interface
- Test component in isolation

### Console Errors

**Common errors and solutions**:

**"Cannot read property 'metadata' of undefined"**:

- Check column object is passed correctly
- Verify metadata exists before accessing: `column.metadata?.field_name`

**"Type 'mytype' is not assignable to type 'SimpleCellDataTypes'"**:

- Add your type to the `SimpleCellDataTypes` union

**"RPC method not found"**:

- Check backend server is running
- Verify RPC method decorator: `@mathesar_rpc_method(...)`
- Check method name matches frontend call

**"Migration already exists"**:

- Delete conflicting migration or renumber yours
- Run `python manage.py migrate` to apply

---

## Conclusion

Adding a new type to Mathesar involves coordinating changes across the full stack:

1. **Backend**: Define metadata model, expose via RPC, implement special behaviors
2. **Frontend**: Configure type, create cell components, register with system
3. **Integration**: Test data flow, handle edge cases, document usage

The User type implementation in this PR serves as a comprehensive reference for all these aspects. Use it as a template when implementing new types.

### Key Takeaways

- **Metadata is your friend**: Store UI configuration separately from database schema
- **Display values are powerful**: Provide human-readable representations without changing data
- **Forms enable configuration**: Let users customize type behavior
- **Type identification is flexible**: Use metadata for fine-grained control
- **Consistency matters**: Follow naming conventions and patterns

### Next Steps

- Review the User type implementation in detail
- Identify which patterns apply to your use case
- Start with a minimal implementation and iterate
- Test thoroughly at each layer
- Document type-specific behavior for users

Happy coding! If you get stuck, refer back to this guide and the User type example code.
