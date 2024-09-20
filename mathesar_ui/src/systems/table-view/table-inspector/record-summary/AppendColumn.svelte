<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';
  import { iconAddNew, iconConstraint, iconTableLink } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    getColumnConstraintTypeByColumnId,
    getColumnIconProps,
  } from '@mathesar/utils/columnUtils';
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);

  export let columns: Column[];
  export let onSelect: (column: Column) => void;
  export let disabled = false;

  function getIcon(column: Column) {
    const constraintsType = getColumnConstraintTypeByColumnId(
      column.id,
      $processedColumns,
    );
    if (constraintsType?.includes('primary')) {
      return iconConstraint;
    }
    if (constraintsType?.includes('foreignkey')) {
      return iconTableLink;
    }

    const icon = getColumnIconProps(column);
    return Array.isArray(icon) ? icon[0] : icon;
  }
</script>

<DropdownMenu
  label={$_('append_column')}
  icon={iconAddNew}
  {disabled}
  size="small"
  appearance="secondary"
>
  {#each columns as column (column.id)}
    <ButtonMenuItem
      label={column.name}
      icon={getIcon(column)}
      on:click={() => onSelect(column)}
    />
  {/each}
</DropdownMenu>
