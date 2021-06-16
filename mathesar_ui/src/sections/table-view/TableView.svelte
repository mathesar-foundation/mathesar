<script lang="ts">
  import { getTable } from '@mathesar/stores/tableData';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import type {
    TableColumnStore,
    TableRecordStore,
    TablePaginationStore,
  } from '@mathesar/stores/tableData';
  import { States } from '@mathesar/utils/api';
  import { Pagination } from '@mathesar-components';

  export let database: string;
  export let id: unknown;

  let columns: TableColumnStore;
  let records: TableRecordStore;
  let pagination: TablePaginationStore;

  function setStores(_database: string, _id: number) {
    const options = URLQueryHandler.getTableConfig(_database, _id);
    const table = getTable(_database, _id, options);
    columns = table.columns;
    records = table.records;
    pagination = table.pagination;
  }

  $: setStores(database, id as number);
</script>

<div class="actions-pane">
  Actions

  {#if $columns.state === States.Loading}
    | Loading table

  {:else if $columns.state === States.Error}
    | Error in loading table: {$columns.error}
  {/if}

  {#if $records.state === States.Loading}
    | Loading records

  {:else if $records.state === States.Error}
    | Error in loading records: {$records.error}
  {/if}
</div>

<div class="table-content">
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

<div class="status-pane">
  <Pagination
    total={$records.totalCount}
    pageSize={$pagination.pageSize}
    bind:page={$pagination.page}/>
</div>

<style global lang="scss">
  @import "TableView.scss";
</style>
