<script lang="ts">
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { iconAddNew } from '@mathesar/icons';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';

  export let columns: Column[];
  export let onSelect: (column: Column) => void;

  function getIcon(column: Column) {
    const icon = getColumnIconProps(column);
    return Array.isArray(icon) ? icon[0] : icon;
  }
</script>

<DropdownMenu label="Append Column" icon={iconAddNew}>
  {#each columns as column (column.id)}
    <ButtonMenuItem
      label={column.name}
      icon={getIcon(column)}
      on:click={() => onSelect(column)}
    />
  {/each}
</DropdownMenu>
