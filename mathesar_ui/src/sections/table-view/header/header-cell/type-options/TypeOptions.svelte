<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import {
    faDatabase,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    currentDBMathesarTypes,
    getMathesarTypeIcon,
    getValidDbTypeTargetsPerMathesarType,
    mathesarTypeHasAtLeastOneValidDbTypeTarget,
    determineMathesarType,
  } from '@mathesar/stores/mathesarTypes';
  import { Button, Icon, Select } from '@mathesar-components';

  import type {
    Column,
    ColumnsDataStore,
    TabularData,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import type {
    MathesarType,
    DbTypeTargetsPerMathesarType,
  } from '@mathesar/stores/mathesarTypes';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  let columnsDataStore: ColumnsDataStore;
  $: ({ columnsDataStore } = $tabularData as TabularData);

  export let column: Column;

  let columnMathesarType: MathesarType;
  $: {
    if ($currentDBMathesarTypes && column) {
      columnMathesarType = determineMathesarType($currentDBMathesarTypes, column.type);
    }
  }

  let validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType | undefined;
  $: {
    if ($currentDBMathesarTypes) {
      // eslint-disable-next-line operator-linebreak
      validDbTypeTargetsPerMathesarType =
        getValidDbTypeTargetsPerMathesarType(column, $currentDBMathesarTypes);
    }
  }

  let validMathesarTypeTargets: MathesarType[] | undefined;
  $: {
    if ($currentDBMathesarTypes && validDbTypeTargetsPerMathesarType) {
      // eslint-disable-next-line operator-linebreak
      validMathesarTypeTargets =
        $currentDBMathesarTypes
          .filter(
            (mt: MathesarType) =>
              // eslint-disable-next-line implicit-arrow-linebreak
              mathesarTypeHasAtLeastOneValidDbTypeTarget(validDbTypeTargetsPerMathesarType, mt),
          );
    }
  }

  let selectedMathesarType: MathesarType;

  function selectMathesarType(mathesarType: MathesarType) {
    selectedMathesarType = mathesarType;
  }

  function resetSelection() {
    selectedMathesarType = undefined;
  }

  function close() {
    resetSelection();
    dispatch('close');
  }

  function onSave() {
    // void columnsDataStore.patchType(column.index, selectedMathesarType);
    close();
  }
</script>

<div class="column-type-menu">
  <h5 class="menu-header">Set Column Type</h5>
  <ul class="type-list">
    {#each validMathesarTypeTargets as mathesarType (mathesarType.identifier)}
      <li class:selected={selectedMathesarType === mathesarType}>
        <Button appearance="plain" on:click={() => selectMathesarType(mathesarType)}>
          <span class="data-icon">{getMathesarTypeIcon(mathesarType)}</span>
          <span>{mathesarType.name}</span>
        </Button>
      </li>
    {/each}
  </ul>
  
  <div class="type-options">
    <!-- TODO: Make tab container more generic to be used here -->
    <ul class="type-option-tabs">
      <li>
        <Button appearance="ghost" class="padding-zero type-option-tab">
          <Icon size="0.75rem" data={faDatabase}/>
          <span>Database</span>
        </Button>
      </li>
    </ul>
    <div class="type-options-content">
      <div>Type in db</div>
      <Select triggerAppearance="default" triggerClass="db-type-select"
        options={column.valid_target_types.map((entry) => ({ id: entry, label: entry }))}/>
    </div>
  </div>

  <div class="divider"></div>
  <div class="type-menu-footer">
    <Button appearance="primary" disabled={!selectedMathesarType} on:click={onSave}>
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
