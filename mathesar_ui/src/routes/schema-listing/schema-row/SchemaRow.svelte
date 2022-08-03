<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Button } from '@mathesar-component-library';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { deleteSchema } from '@mathesar/stores/schemas';
  import { removeTablesInSchemaTablesStore } from '@mathesar/stores/tables';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { currentDBName } from '@mathesar/stores/databases';
  import { iconDeleteAlt, iconLock, iconPencilAlt, iconProject } from '@mathesar/icons';

  const dispatch = createEventDispatcher();

  export let schema: SchemaEntry;

  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';

  function handleDelete() {
    void confirmDelete({
      identifierType: 'Schema',
      identifierName: schema.name,
      body: [
        'All objects in this schema will be deleted permanently, including (but not limited to) tables and views. Some of these objects may not be visible in the Mathesar UI.',
        'Are you sure you want to proceed?',
      ],
      onProceed: async () => {
        await deleteSchema($currentDBName, schema.id);
        // TODO: Create common util to handle data clearing & sync between stores
        removeTablesInSchemaTablesStore(schema.id);
      },
    });
  }
</script>

<div class="schema-row">
  <div class="details">
    <div class="title">
      <Icon {...iconProject} />
      <a href="/{$currentDBName}/{schema.id}">
        {schema.name}
      </a>
      {#if isLocked}
        <Icon class="lock" {...iconLock} />
      {/if}
    </div>
    {#if isDefault}
      <div class="info">
        <strong>Default</strong>
      </div>
    {/if}
  </div>
  {#if !isLocked}
    <div class="controls">
      <Button
        class="edit"
        on:click={() => dispatch('edit', schema)}
        aria-label="Edit Schema"
      >
        <Icon {...iconPencilAlt} />
      </Button>
      <Button class="delete" on:click={handleDelete} aria-label="Delete Schema">
        <Icon {...iconDeleteAlt} />
      </Button>
      <slot />
    </div>
  {/if}
</div>

<style global lang="scss">
  @import 'SchemaRow.scss';
</style>
