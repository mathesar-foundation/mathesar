<script lang="ts">
  import { createEventDispatcher, getContext, tick } from 'svelte';
  import { faDatabase, faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon, Select } from '@mathesar-component-library';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    ColumnsDataStore,
  } from '@mathesar/stores/table-data';
  import { States } from '@mathesar/utils/api';

  import type { DbType } from '@mathesar/App.d';
  import type {
    Column,
    TabularData,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { SelectOption } from '@mathesar-component-library/types';
  import { toast } from '@mathesar/stores/toast';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columnsDataStore } = $tabularData as TabularData);

  export let column: Column;
  export let abstractTypeOfColumn: AbstractType;
  let abstractTypeContainer: HTMLUListElement;

  $: allowedTypeConversions = ColumnsDataStore.getAllowedTypeConversions(
    column,
    $currentDbAbstractTypes.data,
  );

  let selectedAbstractType: AbstractType = null;
  let selectedDBTypeOption: SelectOption<DbType> = null;
  let typeChangeState = States.Idle;

  function selectAbstractType(abstractType: AbstractType) {
    selectedAbstractType = abstractType;
    if (abstractType.identifier === abstractTypeOfColumn.identifier) {
      selectedDBTypeOption = {
        id: column.type,
        label: column.type,
      };
    } else if (abstractType.defaultDbType) {
      selectedDBTypeOption = {
        id: abstractType.defaultDbType,
        label: abstractType.defaultDbType,
      };
    }
  }

  function resetAbstractType() {
    selectedAbstractType = abstractTypeOfColumn;
    selectedDBTypeOption = {
      id: column.type,
      label: column.type,
    };
  }

  async function scrollToSelectedType() {
    await tick();
    const selectedElement: HTMLLIElement = abstractTypeContainer?.querySelector('li.selected');
    if (selectedElement) {
      abstractTypeContainer.scrollTop = selectedElement.offsetTop;
    }
  }

  $: if (!selectedAbstractType && abstractTypeOfColumn) {
    resetAbstractType();
    void scrollToSelectedType();
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
    typeChangeState = States.Done;
    dispatch('close');
  }

  async function onSave() {
    if (selectedDBTypeOption.id !== column.type) {
      typeChangeState = States.Loading;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await columnsDataStore.patchType(column.id, selectedDBTypeOption.id);
      } catch (err) {
        toast.error(`Unable to change column type. ${err.message as string}`);
      }
    }
    close();
  }
</script>

<div class="column-type-menu">
  <h5 class="menu-header">Set Column Type</h5>
  <ul bind:this={abstractTypeContainer} class="type-list">
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
    <Button appearance="primary" disabled={
        !selectedAbstractType || typeChangeState === States.Loading
      } on:click={onSave}>
      {#if typeChangeState === States.Loading}
        <Icon data={faSpinner} spin={true}/>
      {/if}
      <span>Save</span>
    </Button>
    <Button appearance="default" on:click={close}>
      Close
    </Button>
  </div>  
</div>

<style global lang="scss">
  @import "TypeOptions.scss";
</style>
