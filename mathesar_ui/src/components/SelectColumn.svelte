<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import ColumnName from './column/ColumnName.svelte';

  // Additional classes
  let classes = '';
  export { classes as class };

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);

  export let columns: Column[];
  export let column: Column | undefined;
  export let disabled = false;

  function getColumnConstraintTypeByColumnId(columnId: number) {
    const linkFkType = $processedColumns.get(columnId)?.linkFk?.type;
    return linkFkType ? [linkFkType] : undefined;
  }
</script>

<Select
  options={columns}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value={column}
  {disabled}
  class={classes}
  on:change
  let:option
>
  {#if option}
    <ColumnName
      column={{
        ...option,
        constraintsType: getColumnConstraintTypeByColumnId(option.id),
      }}
    />
  {/if}
</Select>
