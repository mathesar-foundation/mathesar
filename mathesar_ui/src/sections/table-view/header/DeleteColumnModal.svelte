<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button, Modal } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import type {
    ColumnsDataStore,
    Column,
  } from '@mathesar/stores/table-data/types';

  export let columnsDataStore: ColumnsDataStore;
  export let column: Column;
  export let isOpen = false;
  let state = States.Idle;
  let error: string;

  async function deleteColumn() {
    if (column) {
      try {
        state = States.Loading;
        error = null;
        await columnsDataStore.deleteColumn(column.id);
        state = States.Done;
      } catch (err) {
        state = States.Error;
        error = (err as Error).message;
      }
    }
  }
</script>

<Modal bind:isOpen class="delete-modal" allowClose={state !== States.Loading}>
    <div class="header">
      Deleting '{column?.name}' could break existing tables and views.
    </div>
    <div class="help-text">
      All Objects related to this column will be afected.
    </div>
    {#if state === States.Idle}
      <div class="help-text">
        Are you sure you want to proceed?
      </div>

    {:else if state === States.Loading}
      <div class="sub-text loading">
        Deleting column {column?.name}
      </div>

    {:else if state === States.Done}
      <div class="sub-text success">
        Column {column?.name} deleted successfully
      </div>

    {:else if error}
      <div class="sub-text error">
        {error}
      </div>
    {/if}

    <svelte:fragment slot="footer">
        <Button disabled={state === States.Loading} on:click={() => { isOpen = false; }}>Close</Button>
        {#if state !== States.Done}
          <Button disabled={state === States.Loading} appearance="primary" on:click={deleteColumn}>
            Delete Column
            {#if state === States.Loading}
              <Icon data={faSpinner} spin={true}/>
            {/if}
          </Button>
        {/if}
    </svelte:fragment>
  </Modal>
