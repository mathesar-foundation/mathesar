<script lang="ts">
  import { get } from 'svelte/store';
  import {
    Button,
    Modal,
  } from '@mathesar-components';
  import {
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';
  import {
    removeTab,
    getTabsForSchema,
  } from '@mathesar/stores/tabs';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  
  export let isOpen = false;
  
  function getActiveTab(_currentDBName, _currentSchemaId) {
    const { activeTab } = getTabsForSchema(_currentDBName, _currentSchemaId);
    const activeTabObj = get(activeTab);
    return activeTabObj;
  }

  async function confirmDelete() {
    const objActiveTab = getActiveTab($currentDBName, $currentSchemaId);
    removeTab($currentDBName, $currentSchemaId, objActiveTab);
    await deleteTable(objActiveTab.id);
    isOpen = false;
    await refetchTablesForSchema($currentSchemaId);
  }

  $: nameActiveTab = getActiveTab($currentDBName, $currentSchemaId);
  
</script>

<Modal class="delete-modal">
    <div class="header">
      Deleting '{nameActiveTab.label}' could break existing tables and views.
    </div >
    <!-- Todo Show dependencies-->
    <div class="help-text">
      All Objects related to this table will be affected.
    </div>
  
  <svelte:fragment slot="footer">
      <Button on:click={() => { isOpen = false; }}>Cancel</Button>
      <Button appearance="primary" on:click={confirmDelete}>
        Delete Table
      </Button>
  </svelte:fragment>
</Modal>
