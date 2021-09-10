<script lang="ts">
  import { Dropdown } from '@mathesar-components';
  import type {
    ColumnPosition,
    GroupOption,
    SortOption,
    TableColumn,
  } from '@mathesar/stores/tableData';
  import type { MathesarType } from '@mathesar/stores/databases';
  import { determineMathesarType, getMathesarTypeIcon } from '@mathesar/stores/databases';
  import HeaderCellDropdownGeneral from './HeaderCellDropdownGeneral.svelte';
  import HeaderCellDropdownTypeOptions from './HeaderCellDropdownTypeOptions.svelte';

  export let mathesarTypes: MathesarType[];
  export let tableId: number;
  export let sort: SortOption;
  export let group: GroupOption;
  export let column: TableColumn;
  export let columnPosition: ColumnPosition;
  export let paddingLeft: number;

  let isOpen = false;

  /**
   * If more than one sub-view should be introduced,
   * a better state mechanism than boolean flags would be desired.
   */
  let isDataTypeOptionsOpen = false;

  function closeDataTypeOptions() {
    isDataTypeOptionsOpen = false;
  }

  let mathesarType: MathesarType | undefined;
  let mathesarTypeIcon: string | undefined;
  $: {
    if (mathesarTypes) {
      mathesarType = determineMathesarType(mathesarTypes, column.type);
      mathesarTypeIcon = getMathesarTypeIcon(mathesarType);
    }
  }

</script>

<div
  class="cell"
  style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left + paddingLeft}px;"
>
  <span class="type">
    {mathesarTypeIcon}
  </span>
  <span class="name">{column.name}</span>

  <Dropdown
    bind:isOpen
    triggerClass="opts"
    triggerAppearance="plain"
    contentClass="table-opts-content"
    on:close={closeDataTypeOptions}
  >
    <svelte:fragment slot="content">
      {#if isDataTypeOptionsOpen}
        <HeaderCellDropdownTypeOptions
          on:reload
          mathesarTypes={mathesarTypes}
          tableId={tableId}
          column={column}
          bind:isOpen
          bind:isDataTypeOptionsOpen
        />
      {:else}
        <HeaderCellDropdownGeneral
          on:reload
          mathesarType={mathesarType}
          mathesarTypeIcon={mathesarTypeIcon}
          bind:sort
          bind:group
          column={column}
          bind:isDataTypeOptionsOpen
        />
      {/if}
    </svelte:fragment>
  </Dropdown>
</div>
