<script lang="ts">
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { iconAddNew, iconTableLink } from '@mathesar/icons';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);

  export let columns: Column[];
  export let onSelect: (column: Column) => void;

  function checkForForeignKey(column: Column) {
    const linkFkType = $processedColumns.get(column.id)?.linkFk?.type;
    if (linkFkType) {
      return true;
    }
  }

  function getIcon(column: Column) {
    const isForeignKey = checkForForeignKey(column);
    if (isForeignKey) {
      return iconTableLink;
    }
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
