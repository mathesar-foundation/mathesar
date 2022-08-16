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
        <span class="lock"><Icon {...iconNotEditable} /></span>
      {/if}
    </div>
    {#if isDefault}<div class="default">Default</div>{/if}
  </div>
  {#if !isLocked}
    <div class="controls">
      <Button
        class="edit"
        on:click={() => dispatch('edit', schema)}
        aria-label="Edit Schema"
      >
        <Icon {...iconEdit} />
      </Button>
      <Button class="delete" on:click={handleDelete} aria-label="Delete Schema">
        <Icon {...iconDelete} />
      </Button>
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
    display: flex;
    flex-direction: row;
    align-items: center;
    color: $color-dark;
    padding: 1em;
  }

  .title {
    display: flex;
    flex-direction: row;
    gap: 0.5em;
  }
  .title a {
    color: $color-link;
    text-decoration: none;
  }
  .title a:hover {
    text-decoration: underline;
  }
  .lock {
    color: $color-muted;
  }
  .default {
    margin-top: 0.5em;
    color: $color-muted;
    font-size: $font-size-info;
    font-weight: 600;
  }
  .controls {
    margin-left: auto;
  }
  .controls :global(.delete) {
    color: $color-danger;
    border-color: $color-danger;
  }
</style>
