<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import {
    currentDBMathesarTypes,
    getMathesarTypeIcon,
    getValidDbTypeTargetsPerMathesarType,
    mathesarTypeHasAtLeastOneValidDbTypeTarget,
    determineMathesarType,
  } from '@mathesar/stores/mathesarTypes';
  import { Button } from '@mathesar-components';

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

<div class="container">
  <h6 class="category">Data Type Options</h6>
  <span class="title">Set Column Type</span>
  <ul class="type-list">
    {#each validMathesarTypeTargets as mathesarType (mathesarType.identifier)}
      {#if mathesarType !== columnMathesarType}
        <li>
          <button
            on:click={() => selectMathesarType(mathesarType)}
            selected={selectedMathesarType === mathesarType}
          >
            <div>
              <span class="data-icon">{getMathesarTypeIcon(mathesarType)}</span>
              <span>{mathesarType.name}</span>
            </div>
          </button>
        </li>
      {/if}
    {:else}
      <li>
      </li>
    {/each}
  </ul>
  <span><i>Placeholder for type options</i></span>
  <div class="divider"></div>
  <div class="button-row">
    <Button appearance="secondary" on:click={close}>
      Cancel
    </Button>
    <Button appearance="primary" disabled={!selectedMathesarType} on:click={onSave}>
      Save
    </Button>
  </div>
</div>
