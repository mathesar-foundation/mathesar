<script lang="ts">
  import { getTable } from '@mathesar/stores/tableData';
  import type { TableColumnStore, TableRecordStore } from '@mathesar/stores/tableData';
  import { States } from '@mathesar/utils/getAPI';

  export let database: string;
  export let id;

  let columns: TableColumnStore;
  let records: TableRecordStore;

  function setStores(_database: string, _id: string) {
    const table = getTable(_database, _id);
    columns = table.columns;
    records = table.records;
  }

  $: setStores(database, id);
</script>

<div class="actions-pane">
  <button>Filter</button>
  <button>Sort</button>
</div>

<div class="table-content">
  {#if $columns.state === States.Loading}
    Loading table

  {:else if $columns.state === States.Error}
    Error in loading table: {$columns.error}
  {/if}

  {#if $records.state === States.Loading}
    Loading records

  {:else if $records.state === States.Error}
    Error in loading records: {$records.error}
  {/if}

  {#if $columns.data.length > 0}
    <table>
      <thead>
        <tr>
          <th></th>
          {#each $columns.data as column, index (column.name)}
            <th>
              {#if index > 0}
                <div class="drag-grip"></div>
              {/if}
              {column.name}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each $records.data as row, index}
          <tr>
            <td>{index + 1}</td>
            {#each $columns.data as column (column.name)}
              <td>{row[column.name]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<div>
  Pagination
</div>
