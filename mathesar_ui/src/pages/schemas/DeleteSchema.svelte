<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Modal,
    Icon,
  } from '@mathesar-components';
  import type { Schema } from '@mathesar/App.d';
  import { States } from '@mathesar/utils/api';
  import { deleteSchema } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';

  export let isOpen = false;
  export let schema: Schema;

  let state: States = States.Idle;
  let error;

  async function removeSchema() {
    if (schema) {
      try {
        state = States.Loading;
        error = null;
        await deleteSchema($currentDBName, schema.id);
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

  {#if schema?.tables.size > 0}
    <div class="help-text">
      All objects ({schema?.tables.size}) in the schema will be deleted permanently
    </div>
    <ul class="schema-table-list">
      {#each [...schema?.tables] as [tableId, table] (tableId)}
        <li>{table.name}</li>
      {/each}
    </ul>
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
