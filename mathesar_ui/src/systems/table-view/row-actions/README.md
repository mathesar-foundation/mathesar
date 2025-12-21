# Record Actions

This directory contains a centralized, headless component for managing record-specific actions in the table view.

## Purpose

The `RecordActions` component provides a single source of truth for record operations (view, duplicate, delete) that can be used in multiple places with different UI presentations:

1. **Table Inspector (Record Tab)**: Renders actions as buttons
2. **Row Context Menu**: Renders actions as menu items

## Components

### `RecordActions.svelte`

A headless Svelte component that:
- Accepts one or more row identifiers (`rowIds: Set<string>`)
- Generates appropriate actions based on the current state and permissions
- Provides actions through a slot prop for custom rendering
- Handles all business logic (permissions, state, API calls)

**Usage Example:**

```svelte
<RecordActions rowIds={selectedRowIds} let:actions>
  {#each actions as action (action.key)}
    {#if action.type === 'button'}
      <Button on:click={action.onClick}>
        {action.label}
      </Button>
    {:else if action.type === 'link'}
      <a href={action.href}>{action.label}</a>
    {/if}
  {/each}
</RecordActions>
```

### `recordActionsUtils.ts`

Helper functions for converting record actions to different formats:

- `getRecordActionMenuEntries()`: Generates menu entries for context menus by reusing the existing entry generators

## Actions

The component provides these actions based on context:

### Single Row Actions
- **Quick View Record**: Opens the record in a modal
- **Open Record**: Links to the dedicated record page
- **Duplicate Record**: Creates a copy of the record (when insert permission exists)

### Multi-Row Actions
- **Delete Records**: Deletes selected records (works for single or multiple rows)

All actions respect the appropriate permissions (`canViewLinkedEntities`, `canInsertRecords`, `canDeleteRecords`).

## Architecture

The headless component pattern allows:
1. **Single Source of Logic**: All permission checks, state management, and action handlers in one place
2. **Flexible Rendering**: Parent components control the DOM structure and styling
3. **Easy Maintenance**: New record actions only need to be added once
4. **Type Safety**: Strongly typed `RecordAction` interface ensures consistency

## Type Definitions

```typescript
export interface RecordAction {
  type: 'button' | 'link';
  key: string;              // Unique identifier for the action
  label: string;            // Display text
  icon: IconProps;          // Icon configuration
  onClick?: () => void;     // Handler for button actions
  href?: string;            // URL for link actions
  disabled?: boolean;       // Whether the action is disabled
  danger?: boolean;         // Whether to show as dangerous action
}
```

## Integration Points

### Table Inspector
`table-inspector/record/RowActions.svelte` uses `RecordActions` to render buttons.

### Context Menu
`context-menu/contextMenu.ts` uses `getRecordActionMenuEntries()` to generate menu items when right-clicking on rows.
