<script lang="ts">
  import type {
    MathesarType,
    DbTypeTargetsPerMathesarType,
  } from '@mathesar/stores/mathesarTypes';
  import {
    getMathesarTypeIcon,
    getValidDbTypeTargetsPerMathesarType,
    mathesarTypeHasAtLeastOneValidDbTypeTarget,
    patchColumnToMathesarType,
    determineMathesarType,
  } from '@mathesar/stores/mathesarTypes';
  import type { TableColumn } from '@mathesar/stores/tableData';
  import { Button } from '@mathesar-components';
  import { isDefined } from '@mathesar/utils/language';
  import { createEventDispatcher } from 'svelte';

  export let mathesarTypes: MathesarType[];
  export let tableId: number;
  export let column: TableColumn;
  export let isOpen: boolean;
  export let isDataTypeOptionsOpen: boolean;

  $: columnId = column.index;

  let columnMathesarType: MathesarType;
  $: {
    if (mathesarTypes && column) {
      columnMathesarType = determineMathesarType(mathesarTypes, column.type);
    }
  }


  let validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType | undefined;
  $: {
    if (mathesarTypes) {
      // eslint-disable-next-line operator-linebreak
      validDbTypeTargetsPerMathesarType =
        getValidDbTypeTargetsPerMathesarType(column, mathesarTypes);
    }
  }

  let validMathesarTypeTargets: MathesarType[] | undefined;
  $: {
    if (mathesarTypes && validDbTypeTargetsPerMathesarType) {
      // eslint-disable-next-line operator-linebreak
      validMathesarTypeTargets =
        mathesarTypes
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

  function closeDropdown() {
    resetSelection();
    isOpen = false;
    isDataTypeOptionsOpen = false;
  }

  function onCancel() {
    closeDropdown();
  }

  const dispatch = createEventDispatcher();

  function onSave() {
    patchColumnToMathesarType(
      dispatch,
      tableId,
      columnId,
      validDbTypeTargetsPerMathesarType,
      selectedMathesarType,
    );
    closeDropdown();
  }

  let isMathesarTypeSelected: boolean;
  let shouldSavingBeDisabled: boolean;
  $: {
    isMathesarTypeSelected = isDefined(selectedMathesarType);
    shouldSavingBeDisabled = !isMathesarTypeSelected;
  }

  function isNotAnIdentityConversion(
    a: MathesarType,
    b: MathesarType,
  ): boolean {
    return a !== b;
  }

</script>

<div class="container">
  <h6 class="category">Data Type Options</h6>
  <span class="title">Set Column Type</span>
  <ul class="type-list">
    {#each validMathesarTypeTargets as mathesarType (mathesarType.identifier)}
      {#if isNotAnIdentityConversion(mathesarType, columnMathesarType)}
        <li>
          <!-- TODO is button the right semantic element? -->
          <button
            on:click={ () => selectMathesarType(mathesarType) }
            selected={ selectedMathesarType === mathesarType }
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
    <Button appearance="secondary" on:click={onCancel}>
      Cancel
    </Button>
    <Button appearance="primary" disabled={shouldSavingBeDisabled} on:click={onSave}>
      Save
    </Button>
  </div>
</div>
