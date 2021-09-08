<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import type {
    TableColumnStore,
    TableRecordStore,
    TableOptionsStore,
  } from '@mathesar/stores/tableData';
  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import { States, } from '@mathesar/utils/api';
  import { Button, Icon, Dropdown } from '@mathesar-components';
  import { currentSchemaId, } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import {
    removeTab,
    getTabsForSchema,
  } from '@mathesar/stores/tabs';
  import {
    refetchTablesForSchema,
    deleteTable,
    tables,
    getTablesStoreForSchema
  } from '@mathesar/stores/tables';
  import {
   getTable,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();

  export let columns: TableColumnStore;
  export let records: TableRecordStore;
  export let options: TableOptionsStore;

  export let selectedEntries: string[];

  function openDisplayOptions() {
    dispatch('openDisplayOptions');
  }

  function openConfirmation(){
    //if table.not empty call store to delete table else show confirmation
    // var table = getTable($currentDBName,$currentSchemaId);
    // var records = table.records;
    // console.log(get(records));
    const { activeTab }  = getTabsForSchema($currentDBName,$currentSchemaId);
    const activeTabObj = get(activeTab)
    console.log(activeTabObj.id);
  }
  
  async function tableDelete(){
    //if table is not empty
    dispatch('deleteTable');
    //else
    // const { activeTab }  = getTabsForSchema($currentDBName,$currentSchemaId);
    // const activeTabObj = get(activeTab);
    // deleteTable('/tables/'+ activeTabObj.id);
    // removeTab($currentDBName,$currentSchemaId,activeTabObj);
    // refetchTablesForSchema($currentSchemaId);
  }
</script>

<div class="actions-pane">
  <Dropdown closeOnInnerClick={true} triggerClass="opts" 
  triggerAppearance="plain" contentClass="table-opts-content"> 
    <svelte:fragment slot="trigger">
      <span>Table</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <ul>
        <li class= "item" on:click={tableDelete}>Delete Table</li>
        <li class= "item" on:click={openConfirmation}>Duplicate Table</li>
      </ul>
    </svelte:fragment>
  </Dropdown>

  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faFilter} size="0.8em"/>
    <span>
      Filters
      {#if $options.filter?.filters?.length > 0}
        ({$options.filter?.filters?.length})
      {/if}
    </span>
  </Button>

  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faSort}/>
    <span>
      Sort
      {#if $options.sort?.size > 0}
        ({$options.sort?.size})
      {/if}
    </span>
  </Button>

  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faListAlt}/>
    <span>
      Group
      {#if $options.group?.size > 0}
        ({$options.group?.size})
      {/if}
    </span>
  </Button>

  {#if selectedEntries.length > 0}
    <Button appearance="plain" on:click={() => dispatch('deleteRecords')}>
      <Icon data={faTrashAlt}/>
      <span>
        Delete {selectedEntries.length} records
      </span>
    </Button>
  {/if}

  <div class="loading-info">
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
</div>
