<script lang="ts">
  import { get } from 'svelte/store';
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Modal,
    Icon,
  } from '@mathesar-components';
  import {
    tables,
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';
  import type {
    DBTablesStoreData,
  } from '@mathesar/stores/tables';
  import {
    removeTab,
    getTabsForSchema,
  } from '@mathesar/stores/tabs';
  import type {
    ActiveTab,
  } from '@mathesar/stores/tabs';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  
  export let isOpen = false;
  
  const nameTables = [];

  function getNameTables(_tables: DBTablesStoreData) {
    _tables?.data?.forEach((value) => {
      nameTables.push(value.name);
    });
  }

  $: getNameTables($tables);

  function getActiveTab(_currentDBName, _currentSchemaId) {
    const { activeTab } = getTabsForSchema(_currentDBName, _currentSchemaId);
    const activeTabObj: ActiveTab = get(activeTab);
    return activeTabObj;
  }

  async function confirmDelete() {
    const objActiveTab = getActiveTab($currentDBName, $currentSchemaId);
    removeTab($currentDBName, $currentSchemaId, objActiveTab);
    await deleteTable(`/tables/${objActiveTab.id}`);
    isOpen = false;
    await refetchTablesForSchema($currentSchemaId);
  }

  $: nameActiveTab = getActiveTab($currentDBName, $currentSchemaId);
  
</script>

<Modal class="delete-modal">
    <div class="header">
      Deleting '{nameActiveTab.label}' could break existing tables and views.
    </div >
    <div class="help-text">
      All Objects related to this table will be afected. 
    </div>
    <ul class="dropdown content">
      {#each nameTables as table}
        <li><Icon data={faTable}/> {table} </li>
      {/each}
    </ul>
  
  <svelte:fragment slot="footer">
      <Button on:click={() => { isOpen = false; }}>Cancel</Button>
      <Button appearance="primary" on:click={confirmDelete}>
        Delete Table
      </Button>
  </svelte:fragment>
 </Modal>