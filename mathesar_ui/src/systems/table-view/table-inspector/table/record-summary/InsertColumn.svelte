<script lang="ts">
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { iconAddNew } from '@mathesar/icons';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';
  import { columnIsUsable } from './TemplateInputFormatter';

  export let columns: Column[];
  export let onSelect: (column: Column) => void;

  $: usableColumns = columns.filter(columnIsUsable);

  function getIcon(column: Column) {
    const icon = getColumnIconProps(column);
    return Array.isArray(icon) ? icon[0] : icon;
  }
</script>

<DropdownMenu label="Insert Column" icon={iconAddNew}>
  {#each usableColumns as column}
    <ButtonMenuItem
      label={column.name}
      icon={getIcon(column)}
      on:click={() => onSelect(column)}
    />
  {/each}
</DropdownMenu>
