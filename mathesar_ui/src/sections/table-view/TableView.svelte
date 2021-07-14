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
    TableDisplayStore,
  } from '@mathesar/stores/tableData';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon } from '@mathesar-components';
  import DisplayOptions from './DisplayOptions.svelte';
  import Header from './Header.svelte';
  import Body from './Body.svelte';

  export let database: string;
  export let id: unknown;
  $: identifier = id as number;

  let columns: TableColumnStore;
  let records: TableRecordStore;
  let options: TableOptionsStore;
  let display: TableDisplayStore;
  let showDisplayOptions = false;
  let horizontalScrollOffset = 0;

  function setStores(_database: string, _id: number) {
    const opts = URLQueryHandler.getTableConfig(_database, _id);
    const table = getTable(_database, _id, opts);
    columns = table.columns;
    records = table.records;
    options = table.options;
    display = table.display;
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
      <Header columns={$columns}
              bind:sort={$options.sort}
              bind:columnPosition={$display.columnPosition}
              {horizontalScrollOffset}
              on:refetch={refetch}/>

      <Body columns={$columns} data={$records.data}
            groupData={$records.groupData}
            bind:horizontalScrollOffset
            columnPosition={$display.columnPosition}/>
    {/if}
  </div>
</div>

<div class="status-pane">
  
</div>

<style global lang="scss">
  @import "TableView.scss";
</style>
