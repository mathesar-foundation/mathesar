<script context="module">
  // TODO move static functions to the module context to make them explicitly static
  // see https://svelte.dev/docs#script_context_module
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { patchColumnType } from '@mathesar/stores/tableData';
  import type { DbType, MathesarType } from '@mathesar/stores/databases';
  import { getMathesarTypeIcon } from '@mathesar/stores/databases';
  import { intersection, pair, notEmpty } from '@mathesar/utils/language';
  import type { TableColumn } from '@mathesar/stores/tableData';
  import { Button } from '@mathesar-components';

  export let mathesarTypes: MathesarType[];
  export let tableId: number;
  export let column: TableColumn;
  export let isOpen: boolean;
  export let isDataTypeOptionsOpen: boolean;

  $: columnId = column.index;

  type DbTypeTargetsPerMathesarType = Map<MathesarType['identifier'], DbType[]>;

  function mathesarTypeHasAtLeastOneValidDbTypeTarget(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    mathesarType: MathesarType,
  ) {
    // eslint-disable-next-line operator-linebreak
    const validDbTypeTargets =
      validDbTypeTargetsPerMathesarType.get(mathesarType.identifier);
    const atLeastOne = notEmpty(validDbTypeTargets);
    return atLeastOne;
  }

  function choosePreferredDbTypeTarget(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    mathesarType: MathesarType,
  ): DbType {
    switch (mathesarType.identifier) {
      case 'number':
        return 'NUMERIC';
      case 'text':
        return 'VARCHAR';
      default:
        throw new Error(`Database type target undefined for Mathesar type ${mathesarType.name}`);
    }
  }

  function getValidDbTypeTargetsPerMathesarType(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    column: TableColumn,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    mathesarTypes: MathesarType[],
  ): DbTypeTargetsPerMathesarType {
    function getValidDbTypeTargetsForColumnAndMathesarType(
      // eslint-disable-next-line @typescript-eslint/no-shadow
      column: TableColumn,
      // eslint-disable-next-line @typescript-eslint/no-shadow
      mathesarType: MathesarType,
    ): DbType[] {
      return intersection(
        new Set(column.validTargetTypes),
        new Set(mathesarType.db_types),
      );
    }
    const pairs = mathesarTypes.map(
      // eslint-disable-next-line @typescript-eslint/no-shadow
      (mathesarType) => pair(
        mathesarType.identifier,
        getValidDbTypeTargetsForColumnAndMathesarType(column, mathesarType),
      ),
    );
    return new Map(pairs);
  }

  const dispatch = createEventDispatcher();

  function patchColumnToMathesarType(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    tableId: number,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    columnId: number,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    mathesarType: MathesarType,
  ): void {
    if (validDbTypeTargetsPerMathesarType) {
      const newDbType = choosePreferredDbTypeTarget(mathesarType);
      const reloadTable = () => dispatch('reload');
      void patchColumnType(tableId, columnId, newDbType)
        .then(reloadTable);
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

  const implementedMathesarTypes: MathesarType['identifier'][] = ['number', 'text'];
  // eslint-disable-next-line operator-linebreak
  const isMathesarTypeImplemented =
    (mathesarType: MathesarType): boolean =>
      // eslint-disable-next-line implicit-arrow-linebreak
      implementedMathesarTypes.includes(mathesarType.identifier);

  let validMathesarTypeTargets: MathesarType[] | undefined;
  $: {
    if (mathesarTypes && validDbTypeTargetsPerMathesarType) {
      // eslint-disable-next-line operator-linebreak
      validMathesarTypeTargets =
        mathesarTypes
          .filter(isMathesarTypeImplemented)
          .filter(
            (mt: MathesarType) =>
              // eslint-disable-next-line implicit-arrow-linebreak
              mathesarTypeHasAtLeastOneValidDbTypeTarget(validDbTypeTargetsPerMathesarType, mt),
          );
    }
  }

  let patchToType: (mathesarType: MathesarType) => void;
  // eslint-disable-next-line @typescript-eslint/no-shadow
  $: {
    if (validDbTypeTargetsPerMathesarType) {
      patchToType = (mathesarType) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        patchColumnToMathesarType(
          tableId,
          columnId,
          validDbTypeTargetsPerMathesarType,
          mathesarType,
        );
    } else {
      // This branch won't be reached.
    }
  }

  const isDefined = <T>(x: T): boolean => typeof x !== 'undefined';

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

  function onSave() {
    patchColumnToMathesarType(
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

</script>

<style lang="scss">
  h6 {
    color: gray;
  }

  .divider {
    border-top: 1px lightgray solid;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
  }
</style>

<div class="container">
  <h6 class="category">Data Type Options</h6>
  <span class="title">Set Column Type</span>
  <ul class="type-list">
    {#each validMathesarTypeTargets as mathesarType}
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
    {:else}
      <li>
      </li>
    {/each}
  </ul>
  <span><i>Placeholder for type options</i></span>
  <div class="divider"></div>
  <div class="buttons">
    <Button appearance="secondary" on:click={onCancel}>
      Cancel
    </Button>
    <Button appearance="primary" disabled={shouldSavingBeDisabled} on:click={onSave}>
      Save
    </Button>
  </div>
</div>
