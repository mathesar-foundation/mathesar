<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Button } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { deleteSchema } from '@mathesar/stores/schemas';
  import { removeTablesInSchemaTablesStore } from '@mathesar/stores/tables';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { iconDelete, iconNotEditable, iconEdit } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import { deleteSchemaConfirmationBody } from './__help__/databaseHelp';

  const dispatch = createEventDispatcher();

  export let database: Database;
  export let schema: SchemaEntry;

  $: href = getSchemaPageUrl(database.name, schema.id);
  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';

  function handleDelete() {
    void confirmDelete({
      identifierType: 'Schema',
      identifierName: schema.name,
      body: deleteSchemaConfirmationBody,
      onProceed: async () => {
        await deleteSchema(database.name, schema.id);
        // TODO: Create common util to handle data clearing & sync between stores
        removeTablesInSchemaTablesStore(schema.id);
      },
    });
  }
</script>

<div class="schema-row">
  <div class="details">
    <div class="title">
      <a {href}><SchemaName {schema} /></a>

      {#if isLocked}
        {#if isDefault}<span class="default">Default</span>{/if}
        <span class="lock"><Icon {...iconNotEditable} /></span>
      {/if}

      {#if !isLocked}
        <div class="controls">
          <Button
            class="edit"
            size="small"
            on:click={() => dispatch('edit', schema)}
            aria-label="Edit Schema"
          >
            <Icon {...iconEdit} />
          </Button>
          <Button
            class="delete"
            size="small"
            on:click={handleDelete}
            aria-label="Delete Schema"
          >
            <Icon {...iconDelete} />
          </Button>

          <slot />
        </div>
      {/if}
    </div>
    <p class="description">Description</p>
    
  </div>
  {#if !isLocked}
    <div class="controls">
      <slot />
    </div>
  {/if}
</div>

<style lang="scss">
  // TODO: Extract design tokens
  $color-dark: #1e1e1e;
  $color-muted: #606066;
  $color-danger: #f47171;
  $color-link: #1a79c8;
  $font-size-info: 0.875rem;

  .schema-row {
    border-radius: 0.25rem;
    color: $color-dark;
    padding: 1em;
    border: 1px solid var(--color-gray-dark);
    height: 100%;
  }

  .title {
    display: flex;
    flex-direction: row;
    gap: 0.25em;
    font-size: var(--text-size-large);
    align-items: center;
    margin-bottom: 0.25rem;
  }
  .title a {
    color: $color-link;
    text-decoration: none;
    flex-grow: 1;
  }
  .title a:hover {
    text-decoration: underline;
  }
  .description {
    color: var(--color-text-muted);
    margin: 0;
  }
  .lock {
    color: var(--color-text-muted);
    font-size: var(--text-size-small);
    padding: 0.25rem;
  }
  .default {
    color: var(--color-text-muted);
    font-weight: 500;
    font-size: var(--text-size-small);
    border: 2px solid var(--color-gray-dark);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
  }
  .controls {
    margin-left: auto;
  }
  .controls :global(.delete) {
    color: $color-danger;
    border-color: $color-danger;
  }
</style>
