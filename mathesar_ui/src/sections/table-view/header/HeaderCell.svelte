<script lang="ts">
  import { Dropdown } from '@mathesar-components';
  import type {
    ColumnPosition,
    GroupOption,
    SortOption,
    TableColumn,
  } from '@mathesar/stores/tableData';
  import type { DbType, MathesarType } from '@mathesar/stores/databases';
  import HeaderCellDropdownGeneral from './HeaderCellDropdownGeneral.svelte';
  import HeaderCellDropdownTypeOptions from './HeaderCellDropdownTypeOptions.svelte';

  export let mathesarTypes: MathesarType[];
  export let tableId: number;
  export let sort: SortOption;
  export let group: GroupOption;
  export let column: TableColumn;
  export let columnPosition: ColumnPosition;
  export let paddingLeft: number;

  let isDataTypeOptionsOpen = false;
  let isOpen = false;

  function closeDataTypeOptions() {
    isDataTypeOptionsOpen = false;
  }

  function determineMathesarType(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    mathesarTypes: MathesarType[],
    dbType: DbType,
  ) {
    const mathesarTypeHasItAsTarget = (mt: MathesarType) => mt.db_types.includes(dbType);
    return mathesarTypes.find(mathesarTypeHasItAsTarget);
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function getIcon(mathesarType: MathesarType): string {
    switch (mathesarType.identifier) {
      case 'number':
        return '#';
      case 'text':
        return 'T';
      default:
        return '?';
    }
  }

  let mathesarType: MathesarType | undefined;
  let mathesarTypeIcon: string | undefined;
  $: {
    if (mathesarTypes) {
      mathesarType = determineMathesarType(mathesarTypes, column.type);
      mathesarTypeIcon = getIcon(mathesarType);
    }
  }

</script>

<style lang="scss">
  /* style .container elements in children components */
  .container > :global(.container) {
    display: flex;
    flex-direction: column;
    margin: 0.75rem;

    & > :global(*) {
      margin: 0.5rem 0;
    }

    & > :global(button) {
      margin: 0;
      /* use padding since these top-level buttons use it for background effects */
      padding: 1rem 0.75rem 1rem 0.5rem;
    }
  }
</style>

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
    functionBeforeClose={closeDataTypeOptions}
  >
    <svelte:fragment slot="content">
      <div class="container">
        {#if isDataTypeOptionsOpen}
          <HeaderCellDropdownTypeOptions
            class="container"
            on:reload
            mathesarTypes={mathesarTypes}
            tableId={tableId}
            column={column}
            bind:isOpen
            bind:isDataTypeOptionsOpen
          />
        {:else}
          <HeaderCellDropdownGeneral
            class="container"
            on:reload
            mathesarType={mathesarType}
            mathesarTypeIcon={mathesarTypeIcon}
            bind:sort
            bind:group
            column={column}
            bind:isDataTypeOptionsOpen
          />
        {/if}
      </div>
    </svelte:fragment>
  </Dropdown>
</div>
