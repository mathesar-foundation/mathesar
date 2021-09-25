<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Modal,
    Icon,
  } from '@mathesar-components';
  import type { SchemaEntry } from '@mathesar/App.d';
  import { States } from '@mathesar/utils/api';
  import { deleteSchema } from '@mathesar/stores/schemas';
  import { removeTablesInSchemaTablesStore } from '@mathesar/stores/tables';
  import { currentDBName } from '@mathesar/stores/databases';

  export let isOpen = false;
  export let schema: SchemaEntry;

  let state: States = States.Idle;
  let error: string;

  async function removeSchema() {
    if (schema) {
      try {
        state = States.Loading;
        error = null;
        await deleteSchema($currentDBName, schema.id);
        // TODO: Create common util to handle data clearing & sync between stores
        removeTablesInSchemaTablesStore(schema.id);
        state = States.Done;
      } catch (err) {
        state = States.Error;
        error = (err as Error).message;
      }
    }
  }
</script>

<Modal class="schema-modal" bind:isOpen closeOnEsc={state !== States.Loading}>
  <div class="header">
    Delete schema '{schema?.name}'
  </div>

  {#if schema?.has_dependencies}
    <div class="help-text">
      All objects in this schema will be deleted permanently, including (but not limited to) tables and views. Some of these objects may not be visible in the Mathesar UI.
    </div>
  {/if}

  {#if state === States.Idle}
    <div class="help-text">
      Are you sure you want to proceed?
    </div>

  {:else if state === States.Loading}
    <div class="sub-text loading">
      Deleting schema {schema?.name}
    </div>

  {:else if state === States.Done}
    <div class="sub-text success">
      Schema {schema?.name} deleted successfully
    </div>

  {:else if error}
    <div class="sub-text error">
      {error}
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <Button disabled={state === States.Loading} on:click={() => { isOpen = false; }}>Close</Button>
    {#if state !== States.Done}
      <Button disabled={state === States.Loading} appearance="primary" on:click={removeSchema}>
        Delete Schema
        {#if state === States.Loading}
          <Icon data={faSpinner} spin={true}/>
        {/if}
      </Button>
    {/if}
  </svelte:fragment>
</Modal>
