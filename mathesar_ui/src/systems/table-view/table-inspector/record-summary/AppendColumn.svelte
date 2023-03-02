<script lang="ts">
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { iconAddNew } from '@mathesar/icons';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';

  export let columns: Column[];
  export let onSelect: (column: Column) => void;

  function getIcon(column: Column) {
    const icon = getColumnIconProps(column);
    return Array.isArray(icon) ? icon[0] : icon;
  }
</script>

<DropdownMenu label="Append Column" icon={iconAddNew} dropdownClass="append-column-dropdown">
  {#each columns as column (column.id)}
    <ButtonMenuItem
      label={column.name}
      icon={getIcon(column)}
      on:click={() => onSelect(column)}
    />
  {/each}
</DropdownMenu>

<style lang="scss">
  :global{
    .append-column-dropdown{
      max-height: calc( 50vh - 5rem)!important;
      scrollbar-width: thin;
      scrollbar-color: #e8e8e8 transparent;
      overflow-x: hidden!important;
      &::-webkit-scrollbar-track {
          background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background-color: #e8e8e8;
      }
      &::-webkit-scrollbar {
        width: 0.5rem;
      }
    }
  }
</style>