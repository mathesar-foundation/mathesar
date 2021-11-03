<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import { faDatabase } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon, Select } from '@mathesar-components';
  import { abstractTypes } from '@mathesar/stores/abstractTypes';
  import {
    ColumnsDataStore,
  } from '@mathesar/stores/table-data';

  import type { DbType } from '@mathesar/App.d';
  import type {
    Column,
    TabularData,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstractTypes';
  import type { SelectOption } from '@mathesar-components/types';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columnsDataStore } = $tabularData as TabularData);

  export let column: Column;
  export let abstractTypeOfColumn: AbstractType;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  $: allowedTypeConversions = ColumnsDataStore.getAllowedTypeConversions(
    column,
    $abstractTypes.data,
  ) as AbstractType[];

  let selectedAbstractType: AbstractType = null;
  let selectedDBTypeOption: SelectOption<DbType> = null;

  function selectAbstractType(abstractType: AbstractType) {
    selectedAbstractType = abstractType;
  }

  function resetAbstractType() {
    selectedAbstractType = abstractTypeOfColumn;
    selectedDBTypeOption = {
      id: column.type,
      label: column.type,
    };
  }

  $: if (!selectedAbstractType && abstractTypeOfColumn) {
    resetAbstractType();
  }

  function calculateDBTypeOptions(_selectedAbstractType: AbstractType): SelectOption[] {
    if (_selectedAbstractType) {
      return Array.from(_selectedAbstractType?.dbTypes).map((entry) => ({
        id: entry,
        label: entry,
      }));
    }
    return [];
  }

  $: dbTypeOptions = calculateDBTypeOptions(selectedAbstractType);

  function close() {
    resetAbstractType();
    dispatch('close');
  }

  function onSave() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    void columnsDataStore.patchType(column.index, selectedDBTypeOption.id);
    close();
  }
</script>

<div class="column-type-menu">
  <h5 class="menu-header">Set Column Type</h5>
  <ul class="type-list">
    {#each allowedTypeConversions as abstractType (abstractType.identifier)}
      <li class:selected={selectedAbstractType?.identifier === abstractType?.identifier}>
        <Button appearance="plain" on:click={() => selectAbstractType(abstractType)}>
          <span class="data-icon">{abstractType.icon}</span>
          <span>{abstractType.name}</span>
        </Button>
      </li>
    {/each}
  </ul>
  
  <div class="type-options">
    <!-- TODO: Make tab container more generic to be used here -->
    <ul class="type-option-tabs">
      <li>
        <Button appearance="ghost" class="padding-zero type-option-tab">
          <Icon size="0.75em" data={faDatabase}/>
          <span>Database</span>
        </Button>
      </li>
    </ul>
    <div class="type-options-content">
      <div>Type in db</div>
      <Select triggerAppearance="default" triggerClass="db-type-select"
        bind:value={selectedDBTypeOption}
        options={dbTypeOptions}/>
    </div>
  </div>

  <div class="divider"></div>
  <div class="type-menu-footer">
    <Button appearance="primary" disabled={!selectedAbstractType} on:click={onSave}>
      Save
    </Button>
    <Button appearance="default" on:click={close}>
      Cancel
    </Button>
  </div>  
</div>

<style global lang="scss">
  @import "TypeOptions.scss";
</style>
