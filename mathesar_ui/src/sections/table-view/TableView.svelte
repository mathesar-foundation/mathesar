<script lang="ts">
  import {
    getTable,
    fetchTableRecords,
  } from '@mathesar/stores/tableData';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import type {
    TableColumnStore,
    TableRecordStore,
    TablePaginationStore,
  } from '@mathesar/stores/tableData';
  import { States } from '@mathesar/utils/api';
  import TablePagination from './TablePagination.svelte';

  export let database: string;
  export let id: unknown;
  $: identifier = id as number;

  let columns: TableColumnStore;
  let records: TableRecordStore;
  let pagination: TablePaginationStore;
  let offset: number;

  function setStores(_database: string, _id: number) {
    const options = URLQueryHandler.getTableConfig(_database, _id);
    const table = getTable(_database, _id, options);
    columns = table.columns;
    records = table.records;
    pagination = table.pagination;
  }

  $: setStores(database, identifier);

  function pageChanged(e: { detail: { originalEvent: Event } }) {
    const { originalEvent } = e.detail;
    originalEvent.preventDefault();
    void fetchTableRecords(database, identifier);
    URLQueryHandler.setTableOptions(database, identifier, $pagination);
  }
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
            <td>
              {offset + index}
            </td>
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
  <TablePagination
    id={identifier} {database}
    total={$records.totalCount}
    pageSize={$pagination.pageSize}
    bind:page={$pagination.page}
    bind:offset={offset}
    on:pageChanged={pageChanged}/>
</div>

<style global lang="scss">
  @import "TableView.scss";
</style>
