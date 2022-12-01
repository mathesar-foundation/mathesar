<script lang="ts">
  import { Button, Icon, InputGroup } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';
  import SelectSortDirection from '@mathesar/components/SelectSortDirection.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { SortDirection } from '@mathesar/stores/table-data';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let availableColumns: Column[];
  export let sortColumnId: number;
  export let sortDirection: SortDirection;
  export let columns: Column[];
  export let disabled: boolean;

  $: sortColumn = columns.find((column) => column.id === sortColumnId)!;
  $: columnOptions = (() => {
    if (sortColumn) {
      if (disabled) {
        return [sortColumn];
      } else {
        return [...availableColumns, sortColumn];
      }
    } else {
      return [];
    }
  })();

  function removeSorter() {
    dispatch('remove', sortColumn?.id);
  }

  function update() {
    dispatch('update', {
      columnId: sortColumn.id,
      direction: sortDirection,
    });
  }
</script>

<div class="sort-entries">
  <InputGroup>
    <SelectColumn
      {disabled}
      columns={columnOptions}
      bind:column={sortColumn}
      on:change={update}
      class="select-sort-column"
    />
    <SelectSortDirection
      class="select-sort-direction"
      bind:value={sortDirection}
      onChange={update}
    />
    <Button size="small" appearance="secondary" on:click={removeSorter}>
      <Icon {...iconDeleteMajor} />
    </Button>
  </InputGroup>
</div>

<style lang="scss">
  .sort-entries {
    :global(.select-sort-direction) {
      width: 6rem;
    }
    :global(.select-sort-column) {
      flex: 1;
    }
  }
</style>
