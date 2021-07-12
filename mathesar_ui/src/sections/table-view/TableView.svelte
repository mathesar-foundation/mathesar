<script lang="ts">
  import { faFilter } from '@fortawesome/free-solid-svg-icons';
  import {
    getTable,
    fetchTableRecords,
  } from '@mathesar/stores/tableData';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import type {
    TableColumnStore,
    TableRecordStore,
    TableOptionsStore,
  } from '@mathesar/stores/tableData';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon } from '@mathesar-components';
  import DisplayOptions from './DisplayOptions.svelte';
  import TablePagination from './TablePagination.svelte';
  import Header from './Header.svelte';
  import Row from './Row.svelte';

  export let database: string;
  export let id: unknown;
  $: identifier = id as number;

  let columns: TableColumnStore;
  let records: TableRecordStore;
  let options: TableOptionsStore;
  let offset: number;
  let showDisplayOptions = false;

  function setStores(_database: string, _id: number) {
    const opts = URLQueryHandler.getTableConfig(_database, _id);
    const table = getTable(_database, _id, opts);
    columns = table.columns;
    records = table.records;
    options = table.options;
  }

  $: setStores(database, identifier);

  function refetch() {
    void fetchTableRecords(database, identifier);
    URLQueryHandler.setTableOptions(database, identifier, $options);
  }

  function toggleDisplayOptions() {
    showDisplayOptions = !showDisplayOptions;
  }
</script>

<div class="actions-pane">
  <Button appearance="plain" on:click={toggleDisplayOptions}>
    <Icon data={faFilter} size="0.8em"/>
    Display properties
  </Button>

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

<div class="table-data" class:has-display-opts={showDisplayOptions}>
  <div class="display-options-pane">
    {#if showDisplayOptions}
      <DisplayOptions/>
    {/if}
  </div>

  <div class="table-content">
    {#if $columns.data.length > 0}
      <table>
        <Header columns={$columns} bind:sort={$options.sort} on:refetch={refetch}/>
        <tbody>
          {#each $records.data as row, index}
            <Row columns={$columns} loading={$records.state === States.Loading}
                  {row} {index} {offset}/>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<div class="status-pane">
  <TablePagination
    id={identifier} {database}
    total={$records.totalCount}
    bind:pageSize={$options.pageSize}
    bind:page={$options.page}
    bind:offset={offset}
    on:change={refetch}/>
</div>

<style global lang="scss">
  @import "TableView.scss";
</style>
